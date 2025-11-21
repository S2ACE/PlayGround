using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VocabularyAPI.Models;

[Table("members")]
public class Members
{
    [Key]
    [StringLength(128)]
    [Column("id")]
    public string Id { get; set; } = string.Empty;

    [Required, StringLength(255)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [StringLength(100)]
    [Column("display_name")]
    public string? DisplayName { get; set; }

    [StringLength(255)]
    [Column("photo_url")]
    public string? PhotoURL { get; set; }

    [Required]
    [Column("email_verified")]
    public bool EmailVerified { get; set; } = false;

    [Required, StringLength(10)]
    [Column("role")]
    public string Role { get; set; } = "user";

    [Required, StringLength(10)]
    [Column("preferred_language")]
    public string PreferredLanguage { get; set; } = "zh-TW";

    [Column("dark_mode")]
    public bool DarkMode { get; set; } = false;

    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("last_login_at")]
    public DateTime? LastLoginAt { get; set; }

    // Navigation properties
    public virtual ICollection<MemberProviders> Providers { get; set; } = new List<MemberProviders>();
    public virtual ICollection<FavouriteVocabulary> FavouriteVocabulary { get; set; } = new List<FavouriteVocabulary>();
    public virtual ICollection<VocabularyProgress> VocabularyProgress { get; set; } = new List<VocabularyProgress>();
}
