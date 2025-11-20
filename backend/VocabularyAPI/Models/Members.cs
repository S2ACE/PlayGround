using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VocabularyAPI.Models
{
    [Table("Members")]
    public class Members
    {
        [Key]
        [StringLength(128)]
        public string Id { get; set; } = string.Empty; // Firebase UID

        [Required]
        [StringLength(255)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [StringLength(100)]
        public string? DisplayName { get; set; }

        [StringLength(500)]
        public string? PhotoURL { get; set; }

        public bool EmailVerified { get; set; }

        [Required]
        [StringLength(20)]
        public string Role { get; set; } = "user";

        [Required]
        [StringLength(10)]
        public string PreferredLanguage { get; set; } = "zh-TW";

        public bool DarkMode { get; set; } = false;

        // 系統欄位
        [Required]
        [Column(TypeName = "datetime2(3)")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [Column(TypeName = "datetime2(3)")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime2(3)")]
        public DateTime? LastLoginAt { get; set; }

        // ✅ EF Core 看到這個屬性，知道 Member 有多個 MemberProvider
        public virtual ICollection<MemberProviders> Providers { get; set; } = new List<MemberProviders>();

        public virtual ICollection<FavouriteVocabulary> FavouriteVocabulary { get; set; } = new List<FavouriteVocabulary>();

        public virtual ICollection<VocabularyProgress> VocabularyProgress { get; set; } = new List<VocabularyProgress>();
    }
}
