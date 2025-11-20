using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabularyAPI.DTOs;
using VocabularyAPI.Services;

namespace VocabularyAPI.Controllers
{
    /// <summary>
    /// 單字學習進度 API
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
        /// 取得用戶的學習進度
        /// </summary>
        /// <param name="memberId">會員 ID</param>
        /// <returns>進度列表</returns>
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
                return BadRequest(new { message = "Member ID 不能為空" });
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (userId != memberId)
            {
                _logger.LogWarning(
                    "未授權存取: UserId={UserId}, RequestedMemberId={MemberId}",
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
                _logger.LogError(ex, "取得學習進度失敗: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "服務器內部錯誤" });
            }
        }

        /// <summary>
        /// 更新或新增單個單字進度
        /// </summary>
        /// <param name="memberId">會員 ID</param>
        /// <param name="request">進度資料</param>
        /// <returns>更新結果</returns>
        /// <response code="200">成功更新</response>
        /// <response code="400">資料驗證失敗</response>
        /// <response code="401">未授權</response>
        /// <response code="403">權限不足</response>
        /// <response code="500">伺服器錯誤</response>
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
                return BadRequest(new { message = "Member ID 不能為空" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // 驗證權限
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
                    message = "進度已更新",
                    vocabularyId = request.VocabularyId,
                    masteredCount = request.MasteredCount
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "更新進度失敗: 參數錯誤");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "更新進度失敗: MemberId={MemberId}, VocabId={VocabId}",
                    memberId, request.VocabularyId);
                return StatusCode(500, new { message = "服務器內部錯誤" });
            }
        }

        /// <summary>
        /// 批量更新進度 (用於測試結束時)
        /// </summary>
        /// <param name="memberId">會員 ID</param>
        /// <param name="request">進度列表</param>
        /// <returns>批量更新結果</returns>
        /// <response code="200">成功批量更新</response>
        /// <response code="400">資料驗證失敗</response>
        /// <response code="401">未授權</response>
        /// <response code="403">權限不足</response>
        /// <response code="500">伺服器錯誤</response>
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
                return BadRequest(new { message = "Member ID 不能為空" });
            }

            if (!ModelState.IsValid || request.ProgressList == null || !request.ProgressList.Any())
            {
                return BadRequest(new { message = "Progress list 不能為空" });
            }

            // 驗證權限
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
                _logger.LogError(ex, "批量更新進度失敗: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "服務器內部錯誤" });
            }
        }

        /// <summary>
        /// 清空學習進度 (刪除所有進度記錄)
        /// </summary>
        /// <param name="memberId">會員 ID</param>
        /// <returns>刪除結果</returns>
        /// <response code="200">成功清空</response>
        /// <response code="400">Member ID 不能為空</response>
        /// <response code="401">未授權</response>
        /// <response code="403">權限不足</response>
        /// <response code="500">伺服器錯誤</response>
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
                return BadRequest(new { message = "Member ID 不能為空" });
            }

            // 驗證權限
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
                    message = $"已清空學習進度,共刪除 {deletedCount} 個",
                    deletedCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "清空學習進度失敗: MemberId={MemberId}", memberId);
                return StatusCode(500, new { message = "服務器內部錯誤" });
            }
        }
    }
}
