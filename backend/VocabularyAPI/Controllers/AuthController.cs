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
        /// Check if an email is already registered (for frontend use).
        /// </summary>
        /// <param name="request">Email check request payload.</param>
        /// <returns>Email existence and provider information.</returns>
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

                _logger.LogInformation(
                    "Email check result: {Email}, Exists: {Exists}, Providers: [{Providers}]",
                    request.Email,
                    response.Exists,
                    string.Join(", ", response.Providers));

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while checking email: {Email}", request.Email);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Sync a Firebase user to the application database.
        /// </summary>
        /// <param name="request">Sync user request payload.</param>
        /// <returns>Sync result.</returns>
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
                // TODO: Add Firebase ID token validation here if needed.
                // var firebaseToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                // await VerifyFirebaseToken(firebaseToken);

                var result = await _membersService.SyncFirebaseUserAsync(request);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while syncing user: {UserId}", request.Id);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
