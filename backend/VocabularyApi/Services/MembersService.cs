// Services/MembersService.cs
using Microsoft.EntityFrameworkCore;
using VocabularyApi.DbContexts;
using VocabularyApi.Models;
using VocabularyApi.DTOs;
using System.Text.Json;

namespace VocabularyApi.Services
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
        /// <param name="id">會員 ID</param>
        /// <returns>會員資料</returns>
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
        /// <param name="email">會員 Email</param>
        /// <returns>會員資料</returns>
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
        /// <param name="email">要檢查的 Email</param>
        /// <returns>是否存在</returns>
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
        /// <param name="id">會員 ID</param>
        /// <param name="request">更新請求</param>
        /// <returns>更新後的會員資料</returns>
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
                // ✅ 檢查會員是否存在（載入現有提供者）
                var existingMember = await _context.Members
                    .Include(m => m.Providers)
                    .FirstOrDefaultAsync(m => m.Id == request.Id);

                bool isNewUser = existingMember == null;
                DateTime loginTime = ParseLoginTime(request.LastLoginAt);

                if (isNewUser)
                {
                    // ✅ 新會員：建立基本資料
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

                    // ✅ 新增當前登入的提供者
                    await AddProviderIfNotExists(request.Id, request.Provider, null);
                }
                else
                {
                    // ✅ 現有會員：更新基本資料
                    existingMember.DisplayName = request.DisplayName ?? existingMember.DisplayName;
                    existingMember.PhotoURL = request.PhotoURL ?? existingMember.PhotoURL;
                    existingMember.EmailVerified = request.EmailVerified;
                    existingMember.UpdatedAt = DateTime.UtcNow;
                    existingMember.LastLoginAt = loginTime;

                    _context.Members.Update(existingMember);
                    _logger.LogInformation("更新用戶: {UserId}, Email: {Email}", request.Id, request.Email);

                    // ✅ 檢查並新增當前登入的提供者（如果不存在）
                    await AddProviderIfNotExists(request.Id, request.Provider, existingMember.Providers);
                }

                await _context.SaveChangesAsync();

                // ✅ 回傳同步結果
                var syncedProviders = await _context.MemberProviders
                    .Where(p => p.Id == request.Id)
                    .Select(p => p.Provider)
                    .ToListAsync();

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
        /// 檢查並新增提供者（如果不存在）
        /// </summary>
        /// <param name="memberId">會員 ID</param>
        /// <param name="provider">提供者名稱</param>
        /// <param name="existingProviders">現有提供者列表</param>
        private async Task AddProviderIfNotExists(string memberId, string provider, ICollection<MemberProvider>? existingProviders)
        {
            if (string.IsNullOrEmpty(provider))
            {
                _logger.LogWarning("Provider 為空，跳過新增，會員 ID: {MemberId}", memberId);
                return;
            }

            // ✅ 標準化提供者名稱
            var standardProvider = DetermineProvider(provider);
            var providerId = ExtractProviderId(provider);

            // ✅ 檢查是否已存在此提供者
            bool providerExists = existingProviders?.Any(p => p.Provider == standardProvider) == true;

            if (!providerExists)
            {
                // ✅ 不存在：新增提供者
                var memberProvider = new MemberProvider
                {
                    Id = memberId,
                    Provider = standardProvider,
                    ProviderId = providerId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.MemberProviders.Add(memberProvider);
                _logger.LogInformation("新增提供者: {MemberId} - {Provider}", memberId, standardProvider);
            }
            else
            {
                // ✅ 已存在：記錄日誌（不重複新增）
                _logger.LogDebug("提供者已存在，跳過新增: {MemberId} - {Provider}", memberId, standardProvider);
            }
        }

        /// <summary>
        /// 解析登入時間
        /// </summary>
        private DateTime ParseLoginTime(string lastLoginAt)
        {
            if (!string.IsNullOrEmpty(lastLoginAt) && DateTime.TryParse(lastLoginAt, out DateTime parsedTime))
            {
                return parsedTime;
            }
            return DateTime.UtcNow;
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
                _ => "password"
            };
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
