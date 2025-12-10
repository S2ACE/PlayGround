using System.ComponentModel.DataAnnotations;

namespace VocabularyAPI.DTOs
{
    public class VocabularyProgressDto
    {
        public int VocabularyId { get; set; }
        public int MasteredCount { get; set; }
        public DateTime LastTestDate { get; set; }
        public string CurrentProficiency
        {
            get
            {
                if (MasteredCount >= 3) return "mastered";
                if (MasteredCount >= 1) return "somewhat_familiar";
                return "not_familiar";
            }
        }
    }

    public class VocabularyProgressListResponseDto
    {
        public List<VocabularyProgressDto> Progress { get; set; } = new List<VocabularyProgressDto>();
        public int TotalCount { get; set; }
    }

    public class UpdateProgressRequestDto
    {
        [Required(ErrorMessage = "VocabularyId is required.")]
        public int VocabularyId { get; set; }

        [Required(ErrorMessage = "MasteredCount is required.")]
        [Range(0, 3, ErrorMessage = "MasteredCount must be between 0 and 3.")]
        public int MasteredCount { get; set; }

        [Required(ErrorMessage = "LastTestDate is required.")]
        public DateTime LastTestDate { get; set; }
    }

    public class BatchUpdateProgressRequestDto
    {
        [Required]
        [MinLength(1, ErrorMessage = "ProgressList cannot be empty.")]
        public List<UpdateProgressRequestDto> ProgressList { get; set; } = new List<UpdateProgressRequestDto>();
    }

    public class BatchUpdateProgressResponseDto
    {
        public int UpdatedCount { get; set; }
        public int NewCount { get; set; }
        public int FailedCount { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public string Message { get; set; } = string.Empty;
    }
}