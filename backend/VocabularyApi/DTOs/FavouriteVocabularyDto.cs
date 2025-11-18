using System.ComponentModel.DataAnnotations;

namespace VocabularyApi.DTOs
{
    public class AddFavouriteRequestDto
    {
        [Required(ErrorMessage = "VocabularyId 為必填")]
        public int VocabularyId { get; set; }
    }
    public class BulkFavouritesRequestDto
    {
        [Required(ErrorMessage = "VocabularyIds 為必填")]
        [MinLength(1, ErrorMessage = "至少需要一個 VocabularyId")]
        public List<int> VocabularyIds { get; set; } = new List<int>();
    }

    public class BulkFavouritesResponseDto
    {
        public int SuccessCount { get; set; }
        public int SkippedCount { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public string Message { get; set; } = string.Empty;
    }

    public class FavouriteVocabularyResponseDto
    {
        public List<int> VocabularyIds { get; set; } = new List<int>();
        public int TotalCount { get; set; }
    }

    public class CheckFavouriteResponseDto
    {
        public int VocabularyId { get; set; }
        public bool IsFavourite { get; set; }
    }
}
