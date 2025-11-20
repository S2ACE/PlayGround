using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VocabularyApi.Models
{
    [Table("FavouriteVocabulary")]
    public class FavouriteVocabulary  // ✅ 更新類別名稱
    {
        [Required]
        [StringLength(128)]
        public string MemberId { get; set; } = string.Empty;

        [Required]
        public int VocabularyId { get; set; }

        [Required]
        [Column(TypeName = "datetime2(3)")]
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        // 導航屬性
        [ForeignKey(nameof(MemberId))]
        public virtual Members Member { get; set; } = null!;

        [ForeignKey(nameof(VocabularyId))]
        public virtual Vocabulary Vocabulary { get; set; } = null!;
    }
}
