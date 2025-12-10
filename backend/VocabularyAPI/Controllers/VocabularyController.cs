using Microsoft.AspNetCore.Mvc;
using VocabularyAPI.Services;
using VocabularyAPI.DTOs;

namespace VocabularyAPI.Controllers
{
    [ApiController]
    [Route("api/vocabulary/{lang}")]
    public class VocabularyController : ControllerBase
    {
        private readonly VocabularyService _service;
        private readonly ILogger<VocabularyController> _logger;

        public VocabularyController(VocabularyService service, ILogger<VocabularyController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Get all vocabulary items for the specified language (DTO version).
        /// </summary>
        /// <param name="lang">Language code.</param>
        /// <returns>Vocabulary DTO list.</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<VocabularyListDto>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IEnumerable<VocabularyListDto>>> GetAll(string lang)
        {
            if (string.IsNullOrWhiteSpace(lang))
            {
                _logger.LogWarning("Empty language code.");
                return BadRequest("Language code cannot be empty.");
            }

            try
            {
                var normalizedLang = lang.Trim().ToLower();
                _logger.LogInformation("Processing vocabulary request for language {Language}", normalizedLang);

                var items = await _service.GetAllByLanguageAsync(normalizedLang);

                if (!items.Any())
                {
                    _logger.LogInformation("No vocabulary found for language {Language}", normalizedLang);
                    return NotFound($"No vocabulary found for language '{normalizedLang}'.");
                }

                _logger.LogInformation("Successfully returned {Count} {Language} vocabulary items", items.Count(), normalizedLang);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while processing vocabulary request for language {Language}", lang);
                return StatusCode(500, "Internal server error.");
            }
        }
    }
}