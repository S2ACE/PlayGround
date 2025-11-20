using Microsoft.EntityFrameworkCore;
using VocabularyAPI.DbContexts;
using VocabularyAPI.DTOs;
using VocabularyAPI.Models;

namespace VocabularyAPI.Services
{
    public class VocabularyProgressService
    {
        private readonly VocabularyContext _context;
        private readonly ILogger<VocabularyProgressService> _logger;

        public VocabularyProgressService(
            VocabularyContext context,
            ILogger<VocabularyProgressService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// 取得用戶的所有學習進度
        /// </summary>
        public async Task<VocabularyProgressListResponseDto> GetProgressByMemberIdAsync(string memberId)
        {
            var progressList = await _context.VocabularyProgress
                .Where(vp => vp.MemberId == memberId)
                .OrderByDescending(vp => vp.LastTestDate)
                .Select(vp => new VocabularyProgressDto
                {
                    VocabularyId = vp.VocabularyId,
                    MasteredCount = vp.MasteredCount,
                    LastTestDate = vp.LastTestDate
                })
                .ToListAsync();

            _logger.LogInformation("取得學習進度: MemberId={MemberId}, Count={Count}",
                memberId, progressList.Count);

            return new VocabularyProgressListResponseDto
            {
                Progress = progressList,
                TotalCount = progressList.Count
            };
        }

        /// <summary>
        /// 更新或新增單個進度
        /// </summary>
        public async Task<bool> UpsertProgressAsync(string memberId, UpdateProgressRequestDto request)
        {
            // 檢查詞彙是否存在
            var vocabularyExists = await _context.Vocabulary.AnyAsync(v => v.Id == request.VocabularyId);
            if (!vocabularyExists)
            {
                _logger.LogWarning("詞彙不存在: VocabularyId={VocabularyId}", request.VocabularyId);
                throw new ArgumentException($"詞彙 ID {request.VocabularyId} 不存在");
            }

            var existing = await _context.VocabularyProgress
                .FirstOrDefaultAsync(vp => vp.MemberId == memberId && vp.VocabularyId == request.VocabularyId);

            if (existing != null)
            {
                // 更新現有記錄
                existing.MasteredCount = request.MasteredCount;
                existing.LastTestDate = request.LastTestDate;

                _logger.LogDebug("更新進度: MemberId={MemberId}, VocabId={VocabId}, Count={Count}",
                    memberId, request.VocabularyId, request.MasteredCount);
            }
            else
            {
                // 新增記錄
                var newProgress = new VocabularyProgress
                {
                    MemberId = memberId,
                    VocabularyId = request.VocabularyId,
                    MasteredCount = request.MasteredCount,
                    LastTestDate = request.LastTestDate,
                    CreatedAt = DateTime.UtcNow
                };

                _context.VocabularyProgress.Add(newProgress);

                _logger.LogDebug("新增進度: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, request.VocabularyId);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// 批量更新進度
        /// </summary>
        public async Task<BatchUpdateProgressResponseDto> BatchUpdateProgressAsync(
            string memberId,
            BatchUpdateProgressRequestDto request)
        {
            var response = new BatchUpdateProgressResponseDto();
            var updatedCount = 0;
            var newCount = 0;
            var failedCount = 0;

            foreach (var progress in request.ProgressList)
            {
                try
                {
                    var existing = await _context.VocabularyProgress
                        .FirstOrDefaultAsync(vp =>
                            vp.MemberId == memberId &&
                            vp.VocabularyId == progress.VocabularyId);

                    if (existing != null)
                    {
                        existing.MasteredCount = progress.MasteredCount;
                        existing.LastTestDate = progress.LastTestDate;
                        updatedCount++;
                    }
                    else
                    {
                        var newProgress = new VocabularyProgress
                        {
                            MemberId = memberId,
                            VocabularyId = progress.VocabularyId,
                            MasteredCount = progress.MasteredCount,
                            LastTestDate = progress.LastTestDate,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.VocabularyProgress.Add(newProgress);
                        newCount++;
                    }
                }
                catch (Exception ex)
                {
                    failedCount++;
                    response.Errors.Add($"VocabId {progress.VocabularyId}: {ex.Message}");
                    _logger.LogError(ex, "批量更新失敗: VocabId={VocabId}", progress.VocabularyId);
                }
            }

            await _context.SaveChangesAsync();

            response.UpdatedCount = updatedCount;
            response.NewCount = newCount;
            response.FailedCount = failedCount;
            response.Message = $"批量更新完成: 更新 {updatedCount} 個, 新增 {newCount} 個, 失敗 {failedCount} 個";

            _logger.LogInformation("批量更新完成: {Message}", response.Message);
            return response;
        }

        /// <summary>
        /// 刪除所有進度
        /// </summary>
        public async Task<int> DeleteAllProgressAsync(string memberId)
        {
            var progressList = await _context.VocabularyProgress
                .Where(vp => vp.MemberId == memberId)
                .ToListAsync();

            _context.VocabularyProgress.RemoveRange(progressList);
            await _context.SaveChangesAsync();

            _logger.LogInformation("清空學習進度: MemberId={MemberId}, Count={Count}",
                memberId, progressList.Count);

            return progressList.Count;
        }
    }
}
