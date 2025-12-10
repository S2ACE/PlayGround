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
        /// Get favourite vocabulary IDs for a member (with in-memory cache).
        /// </summary>
        public async Task<FavouriteVocabularyResponseDto> GetFavouritesByMemberIdAsync(string memberId)
        {
            var cacheKey = $"{CACHE_KEY_PREFIX}{memberId}";

            // Step 1: Try cache first.
            if (_cache.TryGetValue(cacheKey, out FavouriteVocabularyResponseDto? cached))
            {
                _logger.LogInformation("✅ Cache hit: {MemberId}", memberId);
                return cached!;
            }

            // Step 2: Cache miss, query database.
            _logger.LogInformation("⚠️ Cache miss: {MemberId}", memberId);

            var vocabularyIds = await _context.FavouriteVocabulary
                .Where(f => f.MemberId == memberId)
                .OrderByDescending(f => f.AddedAt)
                .Select(f => f.VocabularyId)
                .ToListAsync();

            var response = new FavouriteVocabularyResponseDto
            {
                VocabularyIds = vocabularyIds,
                TotalCount = vocabularyIds.Count
            };

            // Step 3: Configure cache options.
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetSlidingExpiration(CACHE_SLIDING_EXPIRATION)
                .SetAbsoluteExpiration(CACHE_ABSOLUTE_EXPIRATION);

            // Step 4: Store in cache.
            _cache.Set(cacheKey, response, cacheOptions);

            _logger.LogInformation("💾 Cached favourites: MemberId={MemberId}, Count={Count}",
                memberId, vocabularyIds.Count);

            // Step 5: Return result.
            return response;
        }

        /// <summary>
        /// Add a favourite vocabulary for a member.
        /// </summary>
        public async Task<bool> AddFavouriteAsync(string memberId, int vocabularyId)
        {
            var exists = await _context.FavouriteVocabulary
                .AnyAsync(f => f.MemberId == memberId && f.VocabularyId == vocabularyId);

            if (exists)
            {
                _logger.LogInformation("Vocabulary already in favourites: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, vocabularyId);
                return false;
            }

            var vocabularyExists = await _context.Vocabulary.AnyAsync(v => v.Id == vocabularyId);
            if (!vocabularyExists)
            {
                throw new ArgumentException($"Vocabulary ID {vocabularyId} does not exist.");
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

            _logger.LogInformation("✅ Favourite added: MemberId={MemberId}, VocabId={VocabId}",
                memberId, vocabularyId);
            return true;
        }

        /// <summary>
        /// Remove a favourite vocabulary for a member.
        /// </summary>
        public async Task<bool> RemoveFavouriteAsync(string memberId, int vocabularyId)
        {
            var favourite = await _context.FavouriteVocabulary
                .FirstOrDefaultAsync(f => f.MemberId == memberId && f.VocabularyId == vocabularyId);

            if (favourite == null)
            {
                _logger.LogInformation("Favourite not found: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, vocabularyId);
                return false;
            }

            _context.FavouriteVocabulary.Remove(favourite);
            await _context.SaveChangesAsync();

            InvalidateCache(memberId);

            _logger.LogInformation("✅ Favourite removed: MemberId={MemberId}, VocabId={VocabId}",
                memberId, vocabularyId);
            return true;
        }

        // for future enhancement
        /// <summary>
        /// Sync favourites in bulk (from localStorage to database).
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
                            errors.Add($"Vocabulary ID {vocabId} does not exist.");
                            _logger.LogWarning("Vocabulary ID {VocabId} does not exist, skipping sync.", vocabId);
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
                    errors.Add($"Failed to sync vocabulary ID {vocabId}: {ex.Message}");
                    _logger.LogError(ex, "Error while syncing vocabulary ID {VocabId}", vocabId);
                }
            }

            if (successCount > 0)
            {
                await _context.SaveChangesAsync();
                InvalidateCache(memberId);
            }

            _logger.LogInformation("✅ Sync completed: MemberId={MemberId}, Success={Success}, Skipped={Skipped}",
                memberId, successCount, skippedCount);

            return new BulkFavouritesResponseDto
            {
                SuccessCount = successCount,
                SkippedCount = skippedCount,
                Errors = errors,
                Message = $"Sync completed: added {successCount}, skipped {skippedCount}."
            };
        }

        // for future enhancement
        /// <summary>
        /// Delete multiple favourites in a single operation.
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
                        _logger.LogInformation("Favourite not found, skipping: VocabId={VocabId}", vocabId);
                    }
                }
                catch (Exception ex)
                {
                    skippedCount++;
                    errors.Add($"Failed to delete vocabulary ID {vocabId}: {ex.Message}");
                    _logger.LogError(ex, "Error while deleting vocabulary ID {VocabId}", vocabId);
                }
            }

            if (successCount > 0)
            {
                await _context.SaveChangesAsync();
                InvalidateCache(memberId);
            }

            _logger.LogInformation("✅ Bulk delete completed: MemberId={MemberId}, Deleted={Deleted}, Skipped={Skipped}",
                memberId, successCount, skippedCount);

            return new BulkFavouritesResponseDto
            {
                SuccessCount = successCount,
                SkippedCount = skippedCount,
                Errors = errors,
                Message = $"Bulk delete completed: deleted {successCount}, skipped {skippedCount}."
            };
        }

        // for future enhancement
        /// <summary>
        /// Delete all favourites for a member.
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

            _logger.LogInformation("✅ All favourites cleared: MemberId={MemberId}, Count={Count}",
                memberId, favourites.Count);

            return favourites.Count;
        }

        /// <summary>
        /// Invalidate favourites cache entry for a member.
        /// </summary>
        private void InvalidateCache(string memberId)
        {
            var cacheKey = $"{CACHE_KEY_PREFIX}{memberId}";
            _cache.Remove(cacheKey);
            _logger.LogInformation("🗑️ Cache invalidated: MemberId={MemberId}", memberId);
        }
    }
}