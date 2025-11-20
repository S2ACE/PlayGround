using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabularyAPI.Services;
using VocabularyAPI.DTOs;


namespace VocabularyAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly MembersService _membersService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(MembersService membersService, ILogger<AuthController> logger)
        {
            _membersService = membersService;
            _logger = logger;
        }

        /// <summary>
        /// 檢查 Email 是否已存在（供前端使用）
        /// </summary>
        /// <param name="request">Email 檢查請求</param>
        /// <returns>檢查結果</returns>
        [HttpPost("check-email")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(CheckEmailResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]    
        public async Task<ActionResult<CheckEmailResponseDto>> CheckEmail([FromBody] CheckEmailRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var member = await _membersService.GetMemberByEmailAsync(request.Email);

                var response = new CheckEmailResponseDto
                {
                    Exists = member != null,
                    Id = member?.Id,
                    RegisteredAt = member?.CreatedAt,
                    Providers = member?.Providers.Select(p => p.Provider).ToList() ?? new List<string>()
                };

                _logger.LogInformation("Email 檢查結果: {Email}, 存在: {Exists}, 提供者: [{Providers}]",
                    request.Email,
                    response.Exists,
                    string.Join(", ", response.Providers));

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "檢查 Email 時發生錯誤: {Email}", request.Email);
                return StatusCode(500, "服務器內部錯誤");
            }
        }

        /// <summary>
        /// 同步 Firebase 用戶到資料庫
        /// </summary>
        /// <param name="request">同步用戶請求</param>
        /// <returns>同步結果</returns>
        [HttpPost("sync")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(SyncUserResponseDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<SyncUserResponseDto>> SyncUser([FromBody] SyncUserRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // TODO: 在這裡可以加入 Firebase ID Token 驗證
                // var firebaseToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                // await VerifyFirebaseToken(firebaseToken);

                var result = await _membersService.SyncFirebaseUserAsync(request);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "同步用戶時發生錯誤: {UserId}", request.Id);
                return StatusCode(500, "服務器內部錯誤");
            }
        }
    }
}
