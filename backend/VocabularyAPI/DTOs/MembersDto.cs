using System.ComponentModel.DataAnnotations;

namespace VocabularyAPI.DTOs
{
    public class MembersDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public string? PhotoURL { get; set; }
        public bool EmailVerified { get; set; }
        public string Role { get; set; } = string.Empty;
        public string PreferredLanguage { get; set; } = string.Empty;
        public bool DarkMode { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public List<MemberProvidersDto> Providers { get; set; } = new List<MemberProvidersDto>();
    }
    public class MemberProvidersDto
    {
        public string Provider { get; set; } = string.Empty;
        public string ProviderId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class SyncUserRequestDto
    {
        public string Id { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? DisplayName { get; set; }

        public string? PhotoURL { get; set; }

        public bool EmailVerified { get; set; }

        public string LastLoginAt { get; set; } = string.Empty;

        public string PreferredLanguage { get; set; } = "zh-TW";

        public string Role { get; set; } = "user";

        public bool DarkMode { get; set; } = false;

        public List<ProviderInfoDto> Providers { get; set; } = new List<ProviderInfoDto>();
    }

    public class ProviderInfoDto
    {
        public string Provider { get; set; } = string.Empty;
        public string ProviderId { get; set; } = string.Empty;
    }


    public class SyncUserResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool IsNewUser { get; set; }
        public DateTime LastLoginAt { get; set; }
    }

    public class UpdateMemberRequestDto
    {
        [StringLength(100)]
        public string? DisplayName { get; set; }

        [StringLength(500)]
        public string? PhotoURL { get; set; }

        [StringLength(10)]
        public string? PreferredLanguage { get; set; }

        public bool? DarkMode { get; set; }
    }
}
