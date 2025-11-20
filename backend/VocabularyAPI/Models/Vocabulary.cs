using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VocabularyApi.Models
{
    [Table("Vocabulary")]
    public class Vocabulary
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(255)]
        public string Word { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string PartOfSpeech { get; set; } = string.Empty;

        [StringLength(500)]
        public string? ChineseDefinition { get; set; }

        [StringLength(500)]
        public string? EnglishDefinition { get; set; }

        [StringLength(1000)]
        public string? Example { get; set; }

        [StringLength(5)]
        public string? Level { get; set; }

        [Required]
        [StringLength(5)]
        public string Language { get; set; } = string.Empty;

        [StringLength(200)]
        public string? Pronunciation { get; set; }


        [Column(TypeName = "datetime2(3)")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime2(3)")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public virtual ICollection<FavouriteVocabulary> FavouritedBy { get; set; } = new List<FavouriteVocabulary>();
        public virtual ICollection<VocabularyProgress> ProgressRecords { get; set; } = new List<VocabularyProgress>();

    }
}
