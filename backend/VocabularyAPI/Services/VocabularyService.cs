using Microsoft.EntityFrameworkCore;
using VocabularyApi.DbContexts;
using VocabularyApi.Models;
using VocabularyApi.DTOs;

namespace VocabularyApi.Services
{
    public class VocabularyService
    {
        private readonly VocabularyContext _context;
        private readonly ILogger<VocabularyService> _logger;

        public VocabularyService(VocabularyContext context, ILogger<VocabularyService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<VocabularyListDto>> GetAllByLanguageAsync(string language)
        {
            try
            {
                var vocabularies = await _context.Vocabulary
                    .Where(v => v.Language == language)
                    .ToListAsync();

                _logger.LogInformation("從資料庫取得 {Count} 個 {Language} 詞彙 Model", vocabularies.Count, language);

                var vocabularyDtos = vocabularies.Select(v => MapToDto(v)).ToList();

                _logger.LogInformation("成功轉換為 {Count} 個 {Language} DTO 供前端使用", vocabularyDtos.Count, language);

                return vocabularyDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "取得詞彙列表時發生錯誤，語言: {Language}", language);
                throw;
            }
        }

        // Helper Method : model to dto
        private VocabularyListDto MapToDto(Vocabulary vocabulary)
        {
            return new VocabularyListDto
            {
                Id = vocabulary.Id,
                Word = vocabulary.Word,
                PartOfSpeech = vocabulary.PartOfSpeech,
                ChineseDefinition = vocabulary.ChineseDefinition,
                EnglishDefinition = vocabulary.EnglishDefinition,
                Example = vocabulary.Example,
                Level = vocabulary.Level,
                Language = vocabulary.Language,
                Pronunciation = vocabulary.Pronunciation

            };
        }
    }
}
