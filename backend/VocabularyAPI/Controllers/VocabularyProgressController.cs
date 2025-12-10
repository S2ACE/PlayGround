using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabularyAPI.DTOs;
using VocabularyAPI.Services;

namespace VocabularyAPI.Controllers
{
    /// <summary>
    /// Vocabulary learning progress API.
    /// </summary>
    [ApiController]
    [Route("api/progress")]
    [Authorize]
    public class VocabularyProgressController : ControllerBase
    {
        private readonly VocabularyProgressService _service;
        private readonly ILogger<VocabularyProgressController> _logger;

        public VocabularyProgressController(
            VocabularyProgressService service,
            ILogger<VocabularyProgressController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Get learning progress for a member.
        /// </summary>
        /// <param name="memberId">Member ID.</param>
        /// <returns>Progress list.</returns>
        [HttpGet("{memberId}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(VocabularyProgressListResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetProgress(string memberId)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID cannot be empty." });
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (userId != memberId)
            {
                _logger.LogWarning(
                    "Unauthorized access: UserId={UserId}, RequestedMemberId={MemberId}",
                    userId, memberId);
                return Forbid();
            }

            try
            {
                var result = await _service.GetProgressByMemberIdAsync(memberId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get progress: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        /// <summary>
        /// Create or update progress for a single vocabulary item.
        /// </summary>
        /// <param name="memberId">Member ID.</param>
        /// <param name="request">Progress payload.</param>
        /// <returns>Update result.</returns>
        /// <response code="200">Progress updated successfully.</response>
        /// <response code="400">Validation failed.</response>
        /// <response code="401">Unauthorized.</response>
        /// <response code="403">Forbidden.</response>
        /// <response code="500">Internal server error.</response>
        [HttpPost("{memberId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateProgress(
            string memberId,
            [FromBody] UpdateProgressRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID cannot be empty." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (userId != memberId)
            {
                return Forbid();
            }

            try
            {
                await _service.UpsertProgressAsync(memberId, request);
                return Ok(new
                {
                    message = "Progress updated successfully.",
                    vocabularyId = request.VocabularyId,
                    masteredCount = request.MasteredCount
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Failed to update progress: invalid arguments.");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to update progress: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, request.VocabularyId);
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        /// <summary>
        /// Batch update learning progress (used after completing a test).
        /// </summary>
        /// <param name="memberId">Member ID.</param>
        /// <param name="request">Progress list payload.</param>
        /// <returns>Batch update result.</returns>
        /// <response code="200">Batch update completed successfully.</response>
        /// <response code="400">Validation failed.</response>
        /// <response code="401">Unauthorized.</response>
        /// <response code="403">Forbidden.</response>
        /// <response code="500">Internal server error.</response>
        [HttpPost("{memberId}/batch")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(BatchUpdateProgressResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> BatchUpdateProgress(
            string memberId,
            [FromBody] BatchUpdateProgressRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID cannot be empty." });
            }

            if (!ModelState.IsValid || request.ProgressList == null || !request.ProgressList.Any())
            {
                return BadRequest(new { message = "Progress list cannot be empty." });
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (userId != memberId)
            {
                return Forbid();
            }

            try
            {
                var result = await _service.BatchUpdateProgressAsync(memberId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to batch update progress: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        /// <summary>
        /// Delete all learning progress records for a member.
        /// </summary>
        /// <param name="memberId">Member ID.</param>
        /// <returns>Delete summary.</returns>
        /// <response code="200">All progress records cleared.</response>
        /// <response code="400">Member ID cannot be empty.</response>
        /// <response code="401">Unauthorized.</response>
        /// <response code="403">Forbidden.</response>
        /// <response code="500">Internal server error.</response>
        [HttpDelete("{memberId}/all")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteAllProgress(string memberId)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID cannot be empty." });
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (userId != memberId)
            {
                return Forbid();
            }

            try
            {
                var deletedCount = await _service.DeleteAllProgressAsync(memberId);
                return Ok(new
                {
                    message = $"All learning progress cleared. Deleted {deletedCount} records.",
                    deletedCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to clear learning progress: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "Internal server error." });
            }
        }
    }
}