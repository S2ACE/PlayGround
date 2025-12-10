using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabularyAPI.DTOs;
using VocabularyAPI.Services;

namespace VocabularyAPI.Controllers
{
    /// <summary>
    /// Handle favourite vocabulary APIs.
    /// </summary>
    [ApiController]
    [Route("api/favourites")]
    [Authorize]
    public class FavouriteVocabularyController : ControllerBase
    {
        private readonly FavouriteVocabularyService _service;
        private readonly ILogger<FavouriteVocabularyController> _logger;

        public FavouriteVocabularyController(
            FavouriteVocabularyService service,
            ILogger<FavouriteVocabularyController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Get all favourite vocabulary IDs for a member.
        /// GET /api/favourites/{memberId}
        /// </summary>
        [HttpGet("{memberId}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(FavouriteVocabularyResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetFavourites(string memberId)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID cannot be empty." });
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (userId != memberId)
            {
                _logger.LogWarning("Unauthorized access: UserId={UserId}, MemberId={MemberId}", userId, memberId);
                return Forbid();
            }

            try
            {
                var result = await _service.GetFavouritesByMemberIdAsync(memberId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get favourites: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        /// <summary>
        /// Add a new favourite vocabulary for a member.
        /// POST /api/favourites/{memberId}
        /// </summary>
        [HttpPost("{memberId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> AddFavourite(string memberId, [FromBody] AddFavouriteRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID cannot be empty." });
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (userId != memberId)
            {
                _logger.LogWarning("Unauthorized access: UserId={UserId}, MemberId={MemberId}", userId, memberId);
                return Forbid();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var success = await _service.AddFavouriteAsync(memberId, request.VocabularyId);

                if (!success)
                {
                    return Conflict(new { message = "Vocabulary is already in favourites.", vocabularyId = request.VocabularyId });
                }

                return Ok(new { message = "Favourite added successfully.", vocabularyId = request.VocabularyId });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add favourite: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, request.VocabularyId);
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        /// <summary>
        /// Remove a favourite vocabulary for a member.
        /// DELETE /api/favourites/{memberId}/{vocabularyId}
        /// </summary>
        [HttpDelete("{memberId}/{vocabularyId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> RemoveFavourite(string memberId, int vocabularyId)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID cannot be empty." });
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (userId != memberId)
            {
                _logger.LogWarning("Unauthorized access: UserId={UserId}, MemberId={MemberId}", userId, memberId);
                return Forbid();
            }

            try
            {
                var success = await _service.RemoveFavouriteAsync(memberId, vocabularyId);

                if (!success)
                {
                    return NotFound(new { message = "Favourite not found.", vocabularyId });
                }

                return Ok(new { message = "Favourite removed successfully.", vocabularyId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to remove favourite: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, vocabularyId);
                return StatusCode(500, new { message = "Internal server error." });
            }
        }

        // for future enhancement: sync favourites
        /// <summary>
        /// Sync favourites in bulk when user signs in.
        /// POST /api/favourites/{memberId}/sync
        /// </summary>
        /*
        [HttpPost("{memberId}/sync")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(BulkFavouritesResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> SyncFavourites(string memberId, [FromBody] BulkFavouritesRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID cannot be empty." });
            }

            if (!ModelState.IsValid || request.VocabularyIds == null || !request.VocabularyIds.Any())
            {
                return BadRequest(new { message = "Vocabulary IDs cannot be empty." });
            }

            try
            {
                var result = await _service.SyncFavouritesAsync(memberId, request.VocabularyIds);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to sync favourites: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "Internal server error." });
            }
        }
        */

        // for future enhancement: bulk delete
        /// <summary>
        /// Delete multiple favourites in a single request.
        /// POST /api/favourites/{memberId}/bulk-delete
        /// </summary>
        /*
        [HttpPost("{memberId}/bulk-delete")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(BulkFavouritesResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> BulkDeleteFavourites(
            string memberId,
            [FromBody] BulkFavouritesRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID cannot be empty." });
            }

            if (!ModelState.IsValid || request.VocabularyIds == null || !request.VocabularyIds.Any())
            {
                return BadRequest(new { message = "Vocabulary IDs cannot be empty." });
            }

            try
            {
                var result = await _service.BulkDeleteFavouritesAsync(memberId, request.VocabularyIds);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to bulk delete favourites: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "Internal server error." });
            }
        }
        */

        // for future enhancement: delete all
        /// <summary>
        /// Delete all favourites for a member.
        /// DELETE /api/favourites/{memberId}/all
        /// </summary>
        /*
        [HttpDelete("{memberId}/all")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteAllFavourites(string memberId)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID cannot be empty." });
            }

            try
            {
                var deletedCount = await _service.DeleteAllFavouritesAsync(memberId);
                return Ok(new
                {
                    message = $"All favourites cleared. Deleted {deletedCount} items.",
                    deletedCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to clear favourites: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "Internal server error." });
            }
        }
        */

        // for future enhancement: check favourite status
        /// <summary>
        /// Check if a vocabulary item is in favourites.
        /// GET /api/favourites/{memberId}/check/{vocabularyId}
        /// </summary>
        /*
        [HttpGet("{memberId}/check/{vocabularyId}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(CheckFavouriteResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CheckFavourite(string memberId, int vocabularyId)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID cannot be empty." });
            }

            try
            {
                var isFavourite = await _service.IsFavouriteAsync(memberId, vocabularyId);
                return Ok(new CheckFavouriteResponseDto
                {
                    VocabularyId = vocabularyId,
                    IsFavourite = isFavourite
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check favourite status: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, vocabularyId);
                return StatusCode(500, new { message = "Internal server error." });
            }
        }
        */
    }
}
