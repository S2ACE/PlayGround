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
        /// Get all learning progress records for a member.
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

            _logger.LogInformation(
                "Loaded vocabulary progress: MemberId={MemberId}, Count={Count}",
                memberId, progressList.Count);

            return new VocabularyProgressListResponseDto
            {
                Progress = progressList,
                TotalCount = progressList.Count
            };
        }

        /// <summary>
        /// Create or update a single progress record.
        /// </summary>
        public async Task<bool> UpsertProgressAsync(string memberId, UpdateProgressRequestDto request)
        {
            // Validate that the vocabulary item exists.
            var vocabularyExists = await _context.Vocabulary.AnyAsync(v => v.Id == request.VocabularyId);
            if (!vocabularyExists)
            {
                _logger.LogWarning("Vocabulary does not exist: VocabularyId={VocabularyId}", request.VocabularyId);
                throw new ArgumentException($"Vocabulary ID {request.VocabularyId} does not exist.");
            }

            var existing = await _context.VocabularyProgress
                .FirstOrDefaultAsync(vp => vp.MemberId == memberId && vp.VocabularyId == request.VocabularyId);

            if (existing != null)
            {
                // Update existing record.
                existing.MasteredCount = request.MasteredCount;
                existing.LastTestDate = request.LastTestDate;

                _logger.LogDebug(
                    "Updated progress: MemberId={MemberId}, VocabId={VocabId}, Count={Count}",
                    memberId, request.VocabularyId, request.MasteredCount);
            }
            else
            {
                // Insert new record.
                var newProgress = new VocabularyProgress
                {
                    MemberId = memberId,
                    VocabularyId = request.VocabularyId,
                    MasteredCount = request.MasteredCount,
                    LastTestDate = request.LastTestDate,
                    CreatedAt = DateTime.UtcNow
                };

                _context.VocabularyProgress.Add(newProgress);

                _logger.LogDebug(
                    "Inserted new progress: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, request.VocabularyId);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Batch update learning progress records.
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
                    _logger.LogError(ex, "Batch update failed: VocabId={VocabId}", progress.VocabularyId);
                }
            }

            await _context.SaveChangesAsync();

            response.UpdatedCount = updatedCount;
            response.NewCount = newCount;
            response.FailedCount = failedCount;
            response.Message =
                $"Batch update completed: updated {updatedCount}, inserted {newCount}, failed {failedCount}.";

            _logger.LogInformation("Batch update completed: {Message}", response.Message);
            return response;
        }

        /// <summary>
        /// Delete all learning progress records for a member.
        /// </summary>
        public async Task<int> DeleteAllProgressAsync(string memberId)
        {
            var progressList = await _context.VocabularyProgress
                .Where(vp => vp.MemberId == memberId)
                .ToListAsync();

            _context.VocabularyProgress.RemoveRange(progressList);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Cleared learning progress: MemberId={MemberId}, Count={Count}",
                memberId, progressList.Count);

            return progressList.Count;
        }
    }
}