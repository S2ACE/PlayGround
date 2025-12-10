using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabularyAPI.DTOs;
using VocabularyAPI.Services;

namespace VocabularyAPI.Controllers
{
    /// <summary>
    /// Member API.
    /// </summary>
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
        /// Get member profile by ID (current authenticated user only).
        /// </summary>
        /// <param name="id">Member ID.</param>
        /// <returns>Member profile.</returns>
        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(MembersDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<MembersDto>> GetMemberById(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest("ID cannot be empty.");
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (userId != id)
            {
                _logger.LogWarning("Unauthorized access to member data: UserId={UserId}, RequestedId={Id}", userId, id);
                return Forbid();
            }

            try
            {
                var member = await _membersService.GetMemberByIdAsync(id);

                if (member == null)
                {
                    return NotFound($"Member with ID '{id}' was not found.");
                }

                return Ok(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while getting member data, ID: {Id}", id);
                return StatusCode(500, "Internal server error.");
            }
        }

        /// <summary>
        /// Get member profile by email.
        /// </summary>
        /// <param name="email">Member email.</param>
        /// <returns>Member profile.</returns>
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
                    return NotFound($"Member with email '{email}' was not found.");
                }

                return Ok(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while getting member data, Email: {Email}", email);
                return StatusCode(500, "Internal server error.");
            }
        }

        /// <summary>
        /// Update member profile (current authenticated user only).
        /// </summary>
        /// <param name="id">Member ID.</param>
        /// <param name="request">Update request payload.</param>
        /// <returns>Updated member profile.</returns>
        [HttpPut("{id}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(MembersDto))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<MembersDto>> UpdateMember(string id, [FromBody] UpdateMemberRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest("ID cannot be empty.");
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (userId != id)
            {
                _logger.LogWarning("Unauthorized member update: UserId={UserId}, RequestedId={Id}", userId, id);
                return Forbid();
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
                    return NotFound($"Member with ID '{id}' was not found.");
                }

                return Ok(updatedMember);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while updating member data, ID: {Id}", id);
                return StatusCode(500, "Internal server error.");
            }
        }
    }
}
