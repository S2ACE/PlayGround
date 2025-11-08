// DTOs/CheckEmailDto.cs
using System.ComponentModel.DataAnnotations;

namespace VocabularyApi.DTOs
{
    public class CheckEmailRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class CheckEmailResponseDto
    {
        public bool Exists { get; set; }
        public string? Id { get; set; }
        public DateTime? RegisteredAt { get; set; }
        public List<string> Providers { get; set; } = new List<string>();

    }
}
