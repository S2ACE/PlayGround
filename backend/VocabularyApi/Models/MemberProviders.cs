using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VocabularyApi.Models
{
    [Table("MemberProviders")]
    public class MemberProviders
    {
        // ✅ EF Core 看到 "Id" 欄位，推斷這是對應 Member.Id 的外鍵
        [Key, Column(Order = 0)]
        [StringLength(128)]
        [ForeignKey("Members")]
        public string Id { get; set; } = string.Empty;

        [Key, Column(Order = 1)]
        [StringLength(50)]
        public string Provider { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string ProviderId { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "datetime2(3)")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ✅ 反向導航屬性
        public virtual Members Member { get; set; } = null!;
    }
}
