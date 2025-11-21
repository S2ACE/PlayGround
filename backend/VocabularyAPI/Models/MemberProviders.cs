using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("member_providers")]
public class MemberProviders
{
    [Key, Column(Order = 0)]
    [StringLength(128)]
    [ForeignKey("Members")]
    public string MemberId { get; set; } = string.Empty;

    [Key, Column(Order = 1)]
    [StringLength(50)]
    public string Provider { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string ProviderId { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(MemberId))]
    public virtual Members Member { get; set; } = null!;
}
