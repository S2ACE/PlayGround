using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VocabularyAPI.Models
{
    [Table("vocabulary_progress")]
    public class VocabularyProgress
    {
        [Key, Column(Order = 0)]
        [Required]
        [StringLength(128)]
        public string MemberId { get; set; } = string.Empty;

        [Key, Column(Order = 1)]
        [Required]
        public int VocabularyId { get; set; }

        [Required]
        [Range(0, 3)]
        public int MasteredCount { get; set; } = 0;

        [Required]
        public DateTime LastTestDate { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey(nameof(MemberId))]
        public virtual Members? Member { get; set; }

        [ForeignKey(nameof(VocabularyId))]
        public virtual Vocabulary? Vocabulary { get; set; }

        // 計算屬性: 根據 MasteredCount 計算 CurrentProficiency
        [NotMapped]
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
}
