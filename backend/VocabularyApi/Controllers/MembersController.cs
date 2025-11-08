// Controllers/MembersController.cs
using Microsoft.AspNetCore.Mvc;
using VocabularyApi.Services;
using VocabularyApi.DTOs;

namespace VocabularyApi.Controllers
{
    [ApiController]
    [Route("api/members")]
    public class MembersController : ControllerBase
    {
        private readonly MembersService _membersService;
        private readonly ILogger<MembersController> _logger;

        public MembersController(MembersService membersService, ILogger<MembersController> logger)
        {
            _membersService = membersService;
            _logger = logger;
        }

        /// <summary>
        /// 根據 ID 取得會員資料
        /// </summary>
        /// <param name="id">會員 ID</param>
        /// <returns>會員資料</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(MembersDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<MembersDto>> GetMemberById(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest("ID cannot be empty.");
            }

            try
            {
                var member = await _membersService.GetMemberByIdAsync(id);

                if (member == null)
                {
                    return NotFound($"找不到 ID 為 '{id}' 的會員");
                }

                return Ok(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "取得會員資料時發生錯誤，ID: {Id}", id);
                return StatusCode(500, "服務器內部錯誤");
            }
        }

        /// <summary>
        /// 根據 Email 取得會員資料
        /// </summary>
        /// <param name="email">會員 Email</param>
        /// <returns>會員資料</returns>
        [HttpGet("by-email/{email}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(MembersDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<MembersDto>> GetMemberByEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("Email cannot be empty.");
            }

            try
            {
                var member = await _membersService.GetMemberByEmailAsync(email);

                if (member == null)
                {
                    return NotFound($"找不到 Email 為 '{email}' 的會員");
                }

                return Ok(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "取得會員資料時發生錯誤，Email: {Email}", email);
                return StatusCode(500, "服務器內部錯誤");
            }
        }

        /// <summary>
        /// 更新會員資料
        /// </summary>
        /// <param name="id">會員 ID</param>
        /// <param name="request">更新請求</param>
        /// <returns>更新後的會員資料</returns>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(MembersDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<MembersDto>> UpdateMember(string id, [FromBody] UpdateMemberRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest("ID cannot be empty.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var updatedMember = await _membersService.UpdateMemberAsync(id, request);

                if (updatedMember == null)
                {
                    return NotFound($"找不到 ID 為 '{id}' 的會員");
                }

                return Ok(updatedMember);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新會員資料時發生錯誤，ID: {Id}", id);
                return StatusCode(500, "服務器內部錯誤");
            }
        }
    }
}
