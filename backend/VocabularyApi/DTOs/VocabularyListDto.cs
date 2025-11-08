namespace VocabularyApi.DTOs
{
    public class VocabularyListDto
    {
        public int Id { get; set; }
        public string Word { get; set; } = string.Empty;
        public string PartOfSpeech { get; set; } = string.Empty;
        public string? ChineseDefinition { get; set; }
        public string? EnglishDefinition { get; set; }
        public string? Example { get; set; }
        public string? Level { get; set; }
        public string Language { get; set; } = string.Empty;
        public string? Pronunciation { get; set; }

    }
}
