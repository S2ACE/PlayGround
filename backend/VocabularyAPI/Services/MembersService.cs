using FirebaseAdmin.Auth;
using Microsoft.EntityFrameworkCore;
using VocabularyAPI.DbContexts;
using VocabularyAPI.DTOs;
using VocabularyAPI.Helper;

namespace VocabularyAPI.Services
{
    public class MembersService
    {
        private readonly VocabularyContext _context;
        private readonly ILogger<MembersService> _logger;

        public MembersService(VocabularyContext context, ILogger<MembersService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get member profile by ID.
        /// </summary>
        public async Task<MembersDto?> GetMemberByIdAsync(string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                {
                    _logger.LogWarning("ID parameter is empty.");
                    return null;
                }

                var member = await _context.Members
                    .Include(m => m.Providers)
                    .FirstOrDefaultAsync(m => m.Id == id);

                if (member == null)
                {
                    _logger.LogInformation("No member found with ID: {Id}", id);
                    return null;
                }

                _logger.LogInformation(
                    "Member loaded successfully. ID: {Id}, ProviderCount: {ProviderCount}, Providers: [{Providers}]",
                    id,
                    member.Providers?.Count ?? 0,
                    string.Join(", ", member.Providers?.Select(p => p.Provider) ?? new List<string>())
                );

                return MapToDto(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while getting member by ID: {Id}", id);
                throw;
            }
        }

        /// <summary>
        /// Get member profile by email.
        /// </summary>
        public async Task<MembersDto?> GetMemberByEmailAsync(string email)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                {
                    _logger.LogWarning("Email parameter is empty.");
                    return null;
                }

                var normalizedEmail = email.Trim().ToLower();
                var member = await _context.Members
                    .Include(m => m.Providers)
                    .FirstOrDefaultAsync(m => m.Email.ToLower() == normalizedEmail);

                if (member == null)
                {
                    _logger.LogInformation("No member found with email: {Email}", email);
                    return null;
                }

                _logger.LogInformation("Member loaded successfully. Email: {Email}", email);
                return MapToDto(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while getting member by email: {Email}", email);
                throw;
            }
        }

        /// <summary>
        /// Check if an email is already registered.
        /// </summary>
        public async Task<bool> EmailExistsAsync(string email)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                    return false;

                var normalizedEmail = email.Trim().ToLower();
                return await _context.Members
                    .AnyAsync(m => m.Email.ToLower() == normalizedEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while checking if email exists: {Email}", email);
                throw;
            }
        }

        /// <summary>
        /// Update member profile.
        /// </summary>
        public async Task<MembersDto?> UpdateMemberAsync(string id, UpdateMemberRequestDto request)
        {
            try
            {
                var member = await _context.Members.FirstOrDefaultAsync(m => m.Id == id);
                if (member == null)
                {
                    _logger.LogWarning("Attempted to update non-existing member. ID: {Id}", id);
                    return null;
                }

                // Update only non-null fields.
                if (request.DisplayName != null)
                    member.DisplayName = request.DisplayName;

                if (request.PhotoURL != null)
                    member.PhotoURL = request.PhotoURL;

                if (request.PreferredLanguage != null)
                    member.PreferredLanguage = request.PreferredLanguage;

                if (request.DarkMode.HasValue)
                    member.DarkMode = request.DarkMode.Value;

                member.UpdatedAt = DateTime.UtcNow;

                _context.Members.Update(member);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Member updated successfully. ID: {Id}", id);
                return MapToDto(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while updating member. ID: {Id}", id);
                throw;
            }
        }

        /// <summary>
        /// Sync a Firebase user with the local database.
        /// </summary>
        public async Task<SyncUserResponseDto> SyncFirebaseUserAsync(SyncUserRequestDto request)
        {
            try
            {
                var existingMember = await _context.Members
                    .Include(m => m.Providers)
                    .FirstOrDefaultAsync(m => m.Id == request.Id);

                bool isNewUser = existingMember == null;
                DateTime loginTime = DateTimeUtils.ParseLoginTime(request.LastLoginAt);
                bool actualEmailVerified = DetermineEmailVerified(request);

                Members targetMember;

                if (isNewUser)
                {
                    var newMember = new Members
                    {
                        Id = request.Id,
                        Email = request.Email,
                        DisplayName = request.DisplayName,
                        PhotoURL = request.PhotoURL,
                        EmailVerified = request.EmailVerified,
                        Role = request.Role,
                        PreferredLanguage = request.PreferredLanguage,
                        DarkMode = request.DarkMode,
                        CreatedAt = loginTime,
                        UpdatedAt = loginTime,
                        LastLoginAt = loginTime
                    };

                    _context.Members.Add(newMember);
                    _logger.LogInformation("Created new member: {UserId}, Email: {Email}", request.Id, request.Email);
                    targetMember = newMember;
                }
                else
                {
                    existingMember.DisplayName = request.DisplayName ?? existingMember.DisplayName;
                    existingMember.PhotoURL = request.PhotoURL ?? existingMember.PhotoURL;
                    existingMember.EmailVerified = actualEmailVerified;
                    existingMember.UpdatedAt = DateTime.UtcNow;
                    existingMember.LastLoginAt = loginTime;

                    _context.Members.Update(existingMember);
                    _logger.LogInformation("Updated member: {UserId}, Email: {Email}", request.Id, request.Email);
                    targetMember = existingMember;
                }

                await SyncProvidersAsync(request.Id, request.Providers, existingMember?.Providers);

                if (actualEmailVerified && !request.EmailVerified)
                {
                    await UpdateFirebaseEmailVerifiedAsync(request.Id, actualEmailVerified);
                }

                await _context.SaveChangesAsync();

                return new SyncUserResponseDto
                {
                    Id = request.Id,
                    Email = request.Email,
                    IsNewUser = isNewUser,
                    LastLoginAt = loginTime
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while syncing Firebase user: {UserId}", request.Id);
                throw;
            }
        }

        /// <summary>
        /// Sync authentication providers for a member.
        /// </summary>
        private async Task SyncProvidersAsync(
            string memberId,
            List<ProviderInfoDto> requestProviders,
            ICollection<MemberProviders>? existingProviders)
        {
            if (requestProviders == null || requestProviders.Count == 0)
            {
                _logger.LogWarning("Providers list is empty. Skipping sync for member: {MemberId}", memberId);
                return;
            }

            List<MemberProviders> dbProviders;

            if (existingProviders != null && existingProviders.Count > 0)
            {
                dbProviders = existingProviders.ToList();
            }
            else
            {
                dbProviders = await _context.MemberProviders
                    .Where(p => p.MemberId == memberId)
                    .ToListAsync();
            }

            var existingProviderIds = dbProviders.Select(p => p.ProviderId).ToHashSet();

            // Add new providers that do not exist yet.
            foreach (var provider in requestProviders)
            {
                var standardProvider = DetermineProvider(provider.Provider);
                var standardProviderId = string.IsNullOrEmpty(provider.ProviderId)
                    ? ExtractProviderId(provider.Provider)
                    : provider.ProviderId;

                if (!existingProviderIds.Contains(standardProviderId))
                {
                    var newProvider = new MemberProviders
                    {
                        MemberId = memberId,
                        Provider = standardProvider,
                        ProviderId = standardProviderId,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.MemberProviders.Add(newProvider);
                    _logger.LogInformation(
                        "Added provider: {Provider} ({ProviderId}) for user: {UserId}",
                        standardProvider,
                        standardProviderId,
                        memberId
                    );
                }
                else
                {
                    _logger.LogDebug(
                        "Provider already exists, skipping: {ProviderId} for user: {UserId}",
                        standardProviderId,
                        memberId
                    );
                }
            }
        }

        /// <summary>
        /// Normalize provider name.
        /// </summary>
        private string DetermineProvider(string provider)
        {
            return provider?.ToLower() switch
            {
                "email" => "email",
                "google" => "google",
                "google.com" => "google",
                "facebook" => "facebook",
                "facebook.com" => "facebook",
                "apple" => "apple",
                "apple.com" => "apple",
                _ => "email"
            };
        }

        /// <summary>
        /// Get normalized providerId from provider name.
        /// </summary>
        private string ExtractProviderId(string provider)
        {
            return provider?.ToLower() switch
            {
                "email" => "password",
                "google" => "google.com",
                "facebook" => "facebook.com",
                "apple" => "apple.com",
                _ => "password"
            };
        }

        /// <summary>
        /// Determine if email should be treated as verified.
        /// </summary>
        private bool DetermineEmailVerified(SyncUserRequestDto request)
        {
            // Rule: any trusted provider implies verified email.
            var trustedProviders = new[] { "google", "facebook", "apple" };

            bool hasTrustedProvider = request.Providers.Any(p =>
                trustedProviders.Contains(p.Provider.ToLower())
            );

            if (hasTrustedProvider)
            {
                _logger.LogInformation(
                    "✅ User {UserId} has a trusted provider. Setting emailVerified = true.",
                    request.Id
                );
                return true;
            }

            return request.EmailVerified;
        }

        /// <summary>
        /// Update the emailVerified flag in Firebase Auth.
        /// </summary>
        private async Task UpdateFirebaseEmailVerifiedAsync(string uid, bool emailVerified)
        {
            try
            {
                var auth = FirebaseAuth.DefaultInstance;

                var userRecord = await auth.GetUserAsync(uid);

                if (userRecord.EmailVerified == emailVerified)
                {
                    _logger.LogDebug("Firebase emailVerified already {Status}, skipping update.", emailVerified);
                    return;
                }

                var args = new UserRecordArgs
                {
                    Uid = uid,
                    EmailVerified = emailVerified
                };

                await auth.UpdateUserAsync(args);

                _logger.LogInformation(
                    "✅ Firebase emailVerified updated to {Status} for user: {UserId}",
                    emailVerified,
                    uid
                );
            }
            catch (FirebaseAuthException ex)
            {
                _logger.LogError(
                    ex,
                    "❌ Failed to update Firebase emailVerified. User: {UserId}, Error: {ErrorCode}",
                    uid,
                    ex.AuthErrorCode
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Unexpected error while updating Firebase emailVerified. User: {UserId}", uid);
            }
        }

        /// <summary>
        /// Map Members entity to DTO.
        /// </summary>
        private MembersDto MapToDto(Members member)
        {
            return new MembersDto
            {
                Id = member.Id,
                Email = member.Email,
                DisplayName = member.DisplayName,
                PhotoURL = member.PhotoURL,
                EmailVerified = member.EmailVerified,
                Role = member.Role,
                PreferredLanguage = member.PreferredLanguage,
                DarkMode = member.DarkMode,
                CreatedAt = member.CreatedAt,
                UpdatedAt = member.UpdatedAt,
                LastLoginAt = member.LastLoginAt,
                Providers = member.Providers?.Select(p => new MemberProvidersDto
                {
                    Provider = p.Provider,
                    ProviderId = p.ProviderId,
                    CreatedAt = p.CreatedAt
                }).ToList() ?? new List<MemberProvidersDto>()
            };
        }
    }
}