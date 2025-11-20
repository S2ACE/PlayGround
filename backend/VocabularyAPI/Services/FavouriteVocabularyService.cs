using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using VocabularyAPI.DbContexts;
using VocabularyAPI.Models;
using VocabularyAPI.DTOs;

namespace VocabularyAPI.Services
{
    public class FavouriteVocabularyService
    {
        private readonly VocabularyContext _context;
        private readonly IMemoryCache _cache;
        private readonly ILogger<FavouriteVocabularyService> _logger;
        private const string CACHE_KEY_PREFIX = "favourites:";
        private static readonly TimeSpan CACHE_SLIDING_EXPIRATION = TimeSpan.FromMinutes(5);
        private static readonly TimeSpan CACHE_ABSOLUTE_EXPIRATION = TimeSpan.FromHours(1);

        public FavouriteVocabularyService(
            VocabularyContext context,
            IMemoryCache cache,
            ILogger<FavouriteVocabularyService> logger)
        {
            _context = context;
            _cache = cache;
            _logger = logger;
        }

        /// <summary>
        /// 取得會員的收藏 ID 列表 (含 Cache)
        /// </summary>
        public async Task<FavouriteVocabularyResponseDto> GetFavouritesByMemberIdAsync(string memberId)
        {
            var cacheKey = $"{CACHE_KEY_PREFIX}{memberId}";

            // ==================== 步驟 1: 檢查快取 ====================
            if (_cache.TryGetValue(cacheKey, out FavouriteVocabularyResponseDto? cached))
            {
                _logger.LogInformation("✅ Cache Hit: {MemberId}", memberId);
                return cached!;  // 如果有快取,直接回傳,不會執行下面的代碼
            }

            // ==================== 步驟 2: 快取 Miss,查詢資料庫 ====================
            _logger.LogInformation("⚠️ Cache Miss: {MemberId}", memberId);

            var vocabularyIds = await _context.FavouriteVocabulary
                .Where(f => f.MemberId == memberId)
                .OrderByDescending(f => f.AddedAt)
                .Select(f => f.VocabularyId)
                .ToListAsync();  // 👈 從資料庫查詢

            var response = new FavouriteVocabularyResponseDto
            {
                VocabularyIds = vocabularyIds,
                TotalCount = vocabularyIds.Count
            };  // 建立回應物件

            // ==================== 步驟 3: 設定快取選項 ====================
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetSlidingExpiration(TimeSpan.FromMinutes(5))  // 5分鐘無訪問自動過期
                .SetAbsoluteExpiration(TimeSpan.FromHours(1));  // 最長存活1小時

            // ==================== 步驟 4: 【這裡】資料被快取! ====================
            _cache.Set(cacheKey, response, cacheOptions);  // 👈👈👈 就是這一行!
                                                           //         ↑          ↑         ↑
                                                           //      快取Key    要快取的值   過期設定

            _logger.LogInformation("💾 已快取收藏列表: {MemberId}, Count={Count}",
                memberId, vocabularyIds.Count);

            // ==================== 步驟 5: 回傳結果 ====================
            return response;
        }

        /// <summary>
        /// 新增收藏
        /// </summary>
        public async Task<bool> AddFavouriteAsync(string memberId, int vocabularyId)
        {
            var exists = await _context.FavouriteVocabulary
                .AnyAsync(f => f.MemberId == memberId && f.VocabularyId == vocabularyId);

            if (exists)
            {
                _logger.LogInformation("單字已在收藏列表中: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, vocabularyId);
                return false;
            }

            var vocabularyExists = await _context.Vocabulary.AnyAsync(v => v.Id == vocabularyId);
            if (!vocabularyExists)
            {
                throw new ArgumentException($"詞彙 ID {vocabularyId} 不存在");
            }

            var favourite = new FavouriteVocabulary
            {
                MemberId = memberId,
                VocabularyId = vocabularyId,
                AddedAt = DateTime.UtcNow
            };

            _context.FavouriteVocabulary.Add(favourite);
            await _context.SaveChangesAsync();

            InvalidateCache(memberId);

            _logger.LogInformation("✅ 新增收藏成功: MemberId={MemberId}, VocabId={VocabId}",
                memberId, vocabularyId);
            return true;
        }

        /// <summary>
        /// 移除收藏
        /// </summary>
        public async Task<bool> RemoveFavouriteAsync(string memberId, int vocabularyId)
        {
            var favourite = await _context.FavouriteVocabulary
                .FirstOrDefaultAsync(f => f.MemberId == memberId && f.VocabularyId == vocabularyId);

            if (favourite == null)
            {
                _logger.LogInformation("收藏不存在: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, vocabularyId);
                return false;
            }

            _context.FavouriteVocabulary.Remove(favourite);
            await _context.SaveChangesAsync();

            InvalidateCache(memberId);

            _logger.LogInformation("✅ 移除收藏成功: MemberId={MemberId}, VocabId={VocabId}",
                memberId, vocabularyId);
            return true;
        }
        //for future enhancement
        /// <summary>
        /// 批量同步收藏 (localStorage → Database)
        /// </summary>
        public async Task<BulkFavouritesResponseDto> SyncFavouritesAsync(string memberId, List<int> vocabularyIds)
        {
            int successCount = 0;
            int skippedCount = 0;
            var errors = new List<string>();

            foreach (var vocabId in vocabularyIds)
            {
                try
                {
                    var exists = await _context.FavouriteVocabulary
                        .AnyAsync(f => f.MemberId == memberId && f.VocabularyId == vocabId);

                    if (!exists)
                    {
                        var vocabularyExists = await _context.Vocabulary.AnyAsync(v => v.Id == vocabId);
                        if (vocabularyExists)
                        {
                            _context.FavouriteVocabulary.Add(new FavouriteVocabulary
                            {
                                MemberId = memberId,
                                VocabularyId = vocabId,
                                AddedAt = DateTime.UtcNow
                            });
                            successCount++;
                        }
                        else
                        {
                            skippedCount++;
                            errors.Add($"詞彙 ID {vocabId} 不存在");
                            _logger.LogWarning("詞彙 ID {VocabId} 不存在,跳過同步", vocabId);
                        }
                    }
                    else
                    {
                        skippedCount++;
                    }
                }
                catch (Exception ex)
                {
                    skippedCount++;
                    errors.Add($"同步詞彙 ID {vocabId} 失敗: {ex.Message}");
                    _logger.LogError(ex, "同步詞彙 ID {VocabId} 時發生錯誤", vocabId);
                }
            }

            if (successCount > 0)
            {
                await _context.SaveChangesAsync();
                InvalidateCache(memberId);
            }

            _logger.LogInformation("✅ 同步完成: MemberId={MemberId}, Success={Success}, Skipped={Skipped}",
                memberId, successCount, skippedCount);

            return new BulkFavouritesResponseDto
            {
                SuccessCount = successCount,
                SkippedCount = skippedCount,
                Errors = errors,
                Message = $"同步完成: 新增 {successCount} 個,跳過 {skippedCount} 個"
            };
        }
        //for future enhancement
        /// <summary>
        /// 批量刪除收藏
        /// </summary>
        public async Task<BulkFavouritesResponseDto> BulkDeleteFavouritesAsync(string memberId, List<int> vocabularyIds)
        {
            int successCount = 0;
            int skippedCount = 0;
            var errors = new List<string>();

            foreach (var vocabId in vocabularyIds)
            {
                try
                {
                    var favourite = await _context.FavouriteVocabulary
                        .FirstOrDefaultAsync(f => f.MemberId == memberId && f.VocabularyId == vocabId);

                    if (favourite != null)
                    {
                        _context.FavouriteVocabulary.Remove(favourite);
                        successCount++;
                    }
                    else
                    {
                        skippedCount++;
                        _logger.LogInformation("收藏不存在,跳過: VocabId={VocabId}", vocabId);
                    }
                }
                catch (Exception ex)
                {
                    skippedCount++;
                    errors.Add($"刪除詞彙 ID {vocabId} 失敗: {ex.Message}");
                    _logger.LogError(ex, "刪除詞彙 ID {VocabId} 時發生錯誤", vocabId);
                }
            }

            if (successCount > 0)
            {
                await _context.SaveChangesAsync();
                InvalidateCache(memberId);
            }

            _logger.LogInformation("✅ 批量刪除完成: MemberId={MemberId}, Deleted={Deleted}, Skipped={Skipped}",
                memberId, successCount, skippedCount);

            return new BulkFavouritesResponseDto
            {
                SuccessCount = successCount,
                SkippedCount = skippedCount,
                Errors = errors,
                Message = $"批量刪除完成: 刪除 {successCount} 個,跳過 {skippedCount} 個"
            };
        }
        //for future enhancement
        /// <summary>
        /// 刪除所有收藏 (清空收藏列表)
        /// </summary>
        public async Task<int> DeleteAllFavouritesAsync(string memberId)
        {
            var favourites = await _context.FavouriteVocabulary
                .Where(f => f.MemberId == memberId)
                .ToListAsync();

            if (favourites.Count == 0)
            {
                return 0;
            }

            _context.FavouriteVocabulary.RemoveRange(favourites);
            await _context.SaveChangesAsync();

            InvalidateCache(memberId);

            _logger.LogInformation("✅ 已清空收藏列表: MemberId={MemberId}, Count={Count}",
                memberId, favourites.Count);

            return favourites.Count;
        }

        /// <summary>
        /// 清除 Cache
        /// </summary>
        private void InvalidateCache(string memberId)
        {
            var cacheKey = $"{CACHE_KEY_PREFIX}{memberId}";
            _cache.Remove(cacheKey);
            _logger.LogInformation("🗑️ Cache Invalidated: {MemberId}", memberId);
        }
    }
}
