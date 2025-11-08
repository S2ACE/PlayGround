using Microsoft.EntityFrameworkCore;
using VocabularyApi.Models;

namespace VocabularyApi.DbContexts
{
    public class VocabularyContext : DbContext
    {
        public DbSet<Vocabulary> Vocabulary { get; set; }

        public DbSet<Members> Members { get; set; }

        public DbSet<MemberProvider> MemberProviders { get; set; }

        public VocabularyContext(DbContextOptions<VocabularyContext> options) : base(options) 
        {

        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ✅ 配置 MemberProvider 實體
            modelBuilder.Entity<MemberProvider>(entity =>
            {
                // 複合主鍵
                entity.HasKey(e => new { e.Id, e.Provider });

                // 外鍵關係
                entity.HasOne(d => d.Member) // MemberProvider 有一個 Member
                      .WithMany(p => p.Providers) // Member 有多個 MemberProvider
                      .HasForeignKey(d => d.Id)  // 注意：這裡是 Id，不是 MemberId 透過 Id 欄位關聯
                      .OnDelete(DeleteBehavior.Cascade);
            });

            /*可以從 Member (主實體) 配置關係
            modelBuilder.Entity<Members>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasMany(p => p.Providers)     // Members 有多個 MemberProvider
                      .WithOne(d => d.Member)        // MemberProvider 有一個 Member
                      .HasForeignKey(d => d.Id)      // 外鍵是 MemberProvider.Id
                      .OnDelete(DeleteBehavior.Cascade);
            });
            */
        }
    }
}
