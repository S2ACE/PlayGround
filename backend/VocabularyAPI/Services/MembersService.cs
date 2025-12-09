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
        /// 根據 ID 取得會員資料
        /// </summary>
        public async Task<MembersDto?> GetMemberByIdAsync(string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                {
                    _logger.LogWarning("ID 參數為空");
                    return null;
                }

                var member = await _context.Members
                    .Include(m => m.Providers)
                    .FirstOrDefaultAsync(m => m.Id == id);

                if (member == null)
                {
                    _logger.LogInformation("找不到 ID: {Id} 的會員", id);
                    return null;
                }

                _logger.LogInformation("成功取得會員資料，ID: {Id}，提供者數量: {ProviderCount}，提供者: [{Providers}]",
                    id,
                    member.Providers?.Count ?? 0,
                    string.Join(", ", member.Providers?.Select(p => p.Provider) ?? new List<string>()));

                return MapToDto(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "取得會員資料時發生錯誤，ID: {Id}", id);
                throw;
            }
        }

        /// <summary>
        /// 根據 Email 取得會員資料
        /// </summary>
        public async Task<MembersDto?> GetMemberByEmailAsync(string email)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                {
                    _logger.LogWarning("Email 參數為空");
                    return null;
                }

                var normalizedEmail = email.Trim().ToLower();
                var member = await _context.Members
                    .Include(m => m.Providers)
                    .FirstOrDefaultAsync(m => m.Email.ToLower() == normalizedEmail);

                if (member == null)
                {
                    _logger.LogInformation("找不到 Email: {Email} 的會員", email);
                    return null;
                }

                _logger.LogInformation("成功取得會員資料，Email: {Email}", email);
                return MapToDto(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "取得會員資料時發生錯誤，Email: {Email}", email);
                throw;
            }
        }

        /// <summary>
        /// 檢查 Email 是否已存在
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
                _logger.LogError(ex, "檢查 Email 是否存在時發生錯誤，Email: {Email}", email);
                throw;
            }
        }

        /// <summary>
        /// 更新會員資料
        /// </summary>
        public async Task<MembersDto?> UpdateMemberAsync(string id, UpdateMemberRequestDto request)
        {
            try
            {
                var member = await _context.Members.FirstOrDefaultAsync(m => m.Id == id);
                if (member == null)
                {
                    _logger.LogWarning("嘗試更新不存在的會員，ID: {Id}", id);
                    return null;
                }

                // 更新欄位（只更新非 null 的值）
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

                _logger.LogInformation("成功更新會員資料，ID: {Id}", id);
                return MapToDto(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "更新會員資料時發生錯誤，ID: {Id}", id);
                throw;
            }
        }

        /// <summary>
        /// 同步 Firebase 用戶到資料庫
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
                    _logger.LogInformation("創建新用戶: {UserId}, Email: {Email}", request.Id, request.Email);
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
                    _logger.LogInformation("更新用戶: {UserId}, Email: {Email}", request.Id, request.Email);
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
                _logger.LogError(ex, "同步用戶時發生錯誤: {UserId}", request.Id);
                throw;
            }
        }

        /// <summary>
        /// 同步 Providers 到資料庫
        /// </summary>
        private async Task SyncProvidersAsync(string memberId, List<ProviderInfoDto> requestProviders, ICollection<MemberProviders>? existingProviders)
        {
            if (requestProviders == null || requestProviders.Count == 0)
            {
                _logger.LogWarning("Providers 列表為空，跳過同步，會員 ID: {MemberId}", memberId);
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

            // ✅ 新增不存在的 providers
            foreach (var provider in requestProviders)
            {
                // 標準化 provider
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
                        "新增 Provider: {Provider} ({ProviderId}) for User: {UserId}",
                        standardProvider,
                        standardProviderId,
                        memberId
                    );
                }
                else
                {
                    _logger.LogDebug(
                        "Provider 已存在，跳過新增: {ProviderId} for User: {UserId}",
                        standardProviderId,
                        memberId
                    );
                }
            }
        }

        /// <summary>
        /// 標準化提供者名稱
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
        /// 取得對應的 ProviderId
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
        /// 檢查email是否已verified
        /// </summary>
        private bool DetermineEmailVerified(SyncUserRequestDto request)
        {
            // ✅ 規則：只要有任何受信任的 provider，就視為已驗證
            var trustedProviders = new[] { "google", "facebook", "apple" };

            bool hasTrustedProvider = request.Providers.Any(p =>
                trustedProviders.Contains(p.Provider.ToLower())
            );

            if (hasTrustedProvider)
            {
                _logger.LogInformation(
                    "✅ 用戶 {UserId} 有受信任的 provider，設定 emailVerified = true",
                    request.Id
                );
                return true;
            }

            return request.EmailVerified;
        }

        /// <summary>
        /// 更新 Firebase Auth 的 emailVerified 狀態
        /// </summary>
        private async Task UpdateFirebaseEmailVerifiedAsync(string uid, bool emailVerified)
        {
            try
            {
                var auth = FirebaseAuth.DefaultInstance;

                var userRecord = await auth.GetUserAsync(uid);

                if (userRecord.EmailVerified == emailVerified)
                {
                    _logger.LogDebug("Firebase emailVerified 已是 {Status}，無需更新", emailVerified);
                    return;
                }

                var args = new UserRecordArgs
                {
                    Uid = uid,
                    EmailVerified = emailVerified
                };

                await auth.UpdateUserAsync(args);

                _logger.LogInformation(
                    "✅ Firebase emailVerified 已更新為 {Status}，用戶: {UserId}",
                    emailVerified,
                    uid
                );
            }
            catch (FirebaseAuthException ex)
            {
                _logger.LogError(
                    ex,
                    "❌ 更新 Firebase emailVerified 失敗，用戶: {UserId}, 錯誤: {ErrorCode}",
                    uid,
                    ex.AuthErrorCode
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ 更新 Firebase emailVerified 時發生未預期錯誤，用戶: {UserId}", uid);
            }
        }

        /// <summary>
        /// 將 Members 模型轉換為 DTO
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
