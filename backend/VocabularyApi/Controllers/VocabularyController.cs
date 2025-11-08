using Microsoft.AspNetCore.Mvc;
using VocabularyApi.Services;
using VocabularyApi.DTOs;

namespace VocabularyApi.Controllers
{
    [ApiController]
    [Route("api/v1/vocab/{lang}")]
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
        /// 取得所有指定語言的詞彙資料（DTO 版本）
        /// </summary>
        /// <param name="lang">語言代碼</param>
        /// <returns>詞彙 DTO 清單</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<VocabularyListDto>))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IEnumerable<VocabularyListDto>>> GetAll(string lang)
        {
            if (string.IsNullOrWhiteSpace(lang))
            {
                _logger.LogWarning("Empty Lang");
                return BadRequest("Lang can't be empty.");
            }

            try
            {
                var normalizedLang = lang.Trim().ToLower();
                _logger.LogInformation("開始處理語言 {Language} 的詞彙請求", normalizedLang);

                // 從 Service 取得 DTO
                var items = await _service.GetAllByLanguageAsync(normalizedLang);

                if (!items.Any())
                {
                    _logger.LogInformation("沒有找到語言 {Language} 的詞彙", normalizedLang);
                    return NotFound($"找不到語言 '{normalizedLang}' 的詞彙資料");
                }

                _logger.LogInformation("成功回傳 {Count} 個 {Language} 詞彙", items.Count(), normalizedLang);
                return Ok(items);  // 回傳 DTO 給前端
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "處理語言 {Language} 詞彙請求時發生錯誤", lang);
                return StatusCode(500, "服務器內部錯誤");
            }
        }
    }
}
