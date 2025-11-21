using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VocabularyAPI.Models;

[Table("vocabulary")]
public class Vocabulary
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Required, StringLength(255)]
    [Column("word")]
    public string Word { get; set; } = string.Empty;

    [Required, StringLength(50)]
    [Column("part_of_speech")]
    public string PartOfSpeech { get; set; } = string.Empty;

    [StringLength(500)]
    [Column("chinese_definition")]
    public string? ChineseDefinition { get; set; }

    [StringLength(500)]
    [Column("english_definition")]
    public string? EnglishDefinition { get; set; }

    [StringLength(1000)]
    [Column("example")]
    public string? Example { get; set; }

    [StringLength(5)]
    [Column("level")]
    public string? Level { get; set; }

    [StringLength(100)]
    [Column("pronunciation")]
    public string? Pronunciation { get; set; }

    [Required, StringLength(5)]
    [Column("language")]
    public string Language { get; set; } = string.Empty;

    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<FavouriteVocabulary> FavouritedBy { get; set; } = new List<FavouriteVocabulary>();
    public virtual ICollection<VocabularyProgress> ProgressRecords { get; set; } = new List<VocabularyProgress>();
}
