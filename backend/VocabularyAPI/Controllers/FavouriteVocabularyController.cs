using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabularyAPI.DTOs;
using VocabularyAPI.Services;

namespace VocabularyAPI.Controllers
{
    /// <summary>
    /// 處理favourite vocabulary API
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
        /// 取得會員的收藏 ID 列表
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
                return BadRequest(new { message = "Member ID 不能為空" });
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (userId != memberId)
            {
                _logger.LogWarning("未授權存取: UserId={UserId}, MemberId={MemberId}", userId, memberId);
                return Forbid();
            }

            try
            {
                var result = await _service.GetFavouritesByMemberIdAsync(memberId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "取得收藏列表失敗: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "服務器內部錯誤" });
            }
        }

        /// <summary>
        /// 新增收藏
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
                return BadRequest(new { message = "Member ID 不能為空" });
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (userId != memberId)
            {
                _logger.LogWarning("未授權存取: UserId={UserId}, MemberId={MemberId}", userId, memberId);
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
                    return Conflict(new { message = "詞彙已在收藏列表中", vocabularyId = request.VocabularyId });
                }

                return Ok(new { message = "新增收藏成功", vocabularyId = request.VocabularyId });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "新增收藏失敗: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, request.VocabularyId);
                return StatusCode(500, new { message = "服務器內部錯誤" });
            }
        }

        /// <summary>
        /// 移除收藏
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
                return BadRequest(new { message = "Member ID 不能為空" });
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (userId != memberId)
            {
                _logger.LogWarning("未授權存取: UserId={UserId}, MemberId={MemberId}", userId, memberId);
                return Forbid();
            }

            try
            {
                var success = await _service.RemoveFavouriteAsync(memberId, vocabularyId);

                if (!success)
                {
                    return NotFound(new { message = "收藏不存在", vocabularyId });
                }

                return Ok(new { message = "移除收藏成功", vocabularyId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "移除收藏失敗: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, vocabularyId);
                return StatusCode(500, new { message = "服務器內部錯誤" });
            }
        }

        //for future enhancement sync function
        /// <summary>
        /// 批量同步收藏 (登入時使用)
        /// POST /api/favourites/{memberId}/sync
        /// </summary>
        /*[HttpPost("{memberId}/sync")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(BulkFavouritesResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> SyncFavourites(string memberId, [FromBody] BulkFavouritesRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID 不能為空" });
            }

            if (!ModelState.IsValid || request.VocabularyIds == null || !request.VocabularyIds.Any())
            {
                return BadRequest(new { message = "Vocabulary IDs 不能為空" });
            }

            try
            {
                var result = await _service.SyncFavouritesAsync(memberId, request.VocabularyIds);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "同步收藏失敗: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "服務器內部錯誤" });
            }
        }*/

        //for future enhancement
        /// <summary>
        /// 批量刪除收藏
        /// POST /api/favourites/{memberId}/bulk-delete
        /// </summary>
        /*[HttpPost("{memberId}/bulk-delete")]
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
                return BadRequest(new { message = "Member ID 不能為空" });
            }

            if (!ModelState.IsValid || request.VocabularyIds == null || !request.VocabularyIds.Any())
            {
                return BadRequest(new { message = "Vocabulary IDs 不能為空" });
            }

            try
            {
                var result = await _service.BulkDeleteFavouritesAsync(memberId, request.VocabularyIds);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "批量刪除收藏失敗: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "服務器內部錯誤" });
            }
        }*/

        //for future enhancement
        /// <summary>
        /// 清空所有收藏
        /// DELETE /api/favourites/{memberId}/all
        /// </summary>
        /*[HttpDelete("{memberId}/all")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteAllFavourites(string memberId)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID 不能為空" });
            }

            try
            {
                var deletedCount = await _service.DeleteAllFavouritesAsync(memberId);
                return Ok(new
                {
                    message = $"已清空收藏列表,共刪除 {deletedCount} 個",
                    deletedCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "清空收藏列表失敗: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "服務器內部錯誤" });
            }
        }*/

        //for future enhancement
        /// <summary>
        /// 檢查詞彙是否已收藏
        /// GET /api/favourites/{memberId}/check/{vocabularyId}
        /// </summary>
        /*[HttpGet("{memberId}/check/{vocabularyId}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(CheckFavouriteResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CheckFavourite(string memberId, int vocabularyId)
        {
            if (string.IsNullOrWhiteSpace(memberId))
            {
                return BadRequest(new { message = "Member ID 不能為空" });
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
                _logger.LogError(ex, "檢查收藏狀態失敗: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, vocabularyId);
                return StatusCode(500, new { message = "服務器內部錯誤" });
            }
        }*/
    }
}
