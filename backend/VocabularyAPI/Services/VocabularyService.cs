using Microsoft.EntityFrameworkCore;
using VocabularyAPI.DbContexts;
using VocabularyAPI.DTOs;
using VocabularyAPI.Models;

namespace VocabularyAPI.Services
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

        /// <summary>
        /// Get all vocabulary items for a given language and map to DTOs.
        /// </summary>
        public async Task<IEnumerable<VocabularyListDto>> GetAllByLanguageAsync(string language)
        {
            try
            {
                var vocabularies = await _context.Vocabulary
                    .Where(v => v.Language == language)
                    .ToListAsync();

                _logger.LogInformation(
                    "Loaded {Count} {Language} vocabulary model records from database.",
                    vocabularies.Count,
                    language
                );

                var vocabularyDtos = vocabularies.Select(v => MapToDto(v)).ToList();

                _logger.LogInformation(
                    "Successfully mapped to {Count} {Language} DTOs for frontend.",
                    vocabularyDtos.Count,
                    language
                );

                return vocabularyDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while loading vocabulary list. Language: {Language}", language);
                throw;
            }
        }

        // Helper method: map entity model to DTO.
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