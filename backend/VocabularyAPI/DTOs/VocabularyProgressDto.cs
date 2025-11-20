using System.ComponentModel.DataAnnotations;

namespace VocabularyApi.DTOs
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
        [Required(ErrorMessage = "VocabularyId 為必填")]
        public int VocabularyId { get; set; }

        [Required(ErrorMessage = "MasteredCount 為必填")]
        [Range(0, 3, ErrorMessage = "MasteredCount 必須在 0-3 之間")]
        public int MasteredCount { get; set; }

        [Required(ErrorMessage = "LastTestDate 為必填")]
        public DateTime LastTestDate { get; set; }
    }

    public class BatchUpdateProgressRequestDto
    {
        [Required]
        [MinLength(1, ErrorMessage = "ProgressList 不能為空")]
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
