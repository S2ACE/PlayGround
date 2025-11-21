using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("favourite_vocabulary")]
public class FavouriteVocabulary
{
    [Key, Column(Order = 0)]
    [StringLength(128)]
    public string MemberId { get; set; } = string.Empty;

    [Key, Column(Order = 1)]
    public int VocabularyId { get; set; }

    [Required]
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(MemberId))]
    public virtual Members Member { get; set; } = null!;

    [ForeignKey(nameof(VocabularyId))]
    public virtual Vocabulary Vocabulary { get; set; } = null!;
}
