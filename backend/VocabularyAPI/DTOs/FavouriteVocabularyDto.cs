using System.ComponentModel.DataAnnotations;

namespace VocabularyAPI.DTOs
{
    public class AddFavouriteRequestDto
    {
        [Required(ErrorMessage = "VocabularyId is required.")]
        public int VocabularyId { get; set; }
    }

    public class BulkFavouritesRequestDto
    {
        [Required(ErrorMessage = "VocabularyIds is required.")]
        [MinLength(1, ErrorMessage = "At least one VocabularyId is required.")]
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
