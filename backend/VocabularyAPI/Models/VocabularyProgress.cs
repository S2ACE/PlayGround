using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VocabularyAPI.Models
{
    [Table("vocabulary_progress")]
    public class VocabularyProgress
    {
        [Key, Column("member_id", Order = 0)]
        [Required]
        [StringLength(128)]
        public string MemberId { get; set; } = string.Empty;

        [Key, Column("vocabulary_id", Order = 1)]
        [Required]
        public int VocabularyId { get; set; }

        [Required]
        [Range(0, 3)]
        [Column("mastered_count")]
        public int MasteredCount { get; set; } = 0;

        [Required]
        [Column("last_test_date")]
        public DateTime LastTestDate { get; set; }

        [Required]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey(nameof(MemberId))]
        public virtual Members? Member { get; set; }

        [ForeignKey(nameof(VocabularyId))]
        public virtual Vocabulary? Vocabulary { get; set; }

        // Computed property: derive current proficiency from MasteredCount.
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