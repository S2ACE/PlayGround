using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VocabularyAPI.Models;

[Table("members")]
public class Members
{
    [Key]
    [StringLength(128)]
    public string Id { get; set; } = string.Empty;

    [Required, StringLength(255)]
    public string Email { get; set; } = string.Empty;

    [StringLength(100)]
    public string? DisplayName { get; set; }

    [StringLength(255)]
    public string? PhotoURL { get; set; }

    [Required]
    public bool EmailVerified { get; set; } = false;

    [Required, StringLength(10)]
    public string Role { get; set; } = "user";

    [Required, StringLength(10)]
    public string PreferredLanguage { get; set; } = "zh-TW";

    public bool DarkMode { get; set; } = false;


    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAt { get; set; }

    // Navigation properties
    public virtual ICollection<MemberProviders> Providers { get; set; } = new List<MemberProviders>();
    public virtual ICollection<FavouriteVocabulary> FavouriteVocabulary { get; set; } = new List<FavouriteVocabulary>();
    public virtual ICollection<VocabularyProgress> VocabularyProgress { get; set; } = new List<VocabularyProgress>();
}
