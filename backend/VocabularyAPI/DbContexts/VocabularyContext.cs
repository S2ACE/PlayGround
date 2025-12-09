using Microsoft.EntityFrameworkCore;
using VocabularyAPI.Models;

namespace VocabularyAPI.DbContexts
{
    public class VocabularyContext : DbContext
    {
        public DbSet<Vocabulary> Vocabulary { get; set; }

        public DbSet<Members> Members { get; set; }

        public DbSet<MemberProviders> MemberProviders { get; set; }

        public DbSet<FavouriteVocabulary> FavouriteVocabulary { get; set; }

        public DbSet<VocabularyProgress> VocabularyProgress { get; set; }

        public VocabularyContext(DbContextOptions<VocabularyContext> options) : base(options) 
        {

        }

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            base.ConfigureConventions(configurationBuilder);

            configurationBuilder
                .Properties<DateTime>()
                .HaveColumnType("timestamp with time zone");

            configurationBuilder
                .Properties<DateTime?>()
                .HaveColumnType("timestamp with time zone");
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ✅ 配置 MemberProvider 實體
            modelBuilder.Entity<MemberProviders>(entity =>
            {
                // 複合主鍵
                entity.HasKey(e => new { e.MemberId, e.Provider });

                // 外鍵關係
                entity.HasOne(d => d.Member) // MemberProvider 有一個 Member
                      .WithMany(p => p.Providers) // Member 有多個 MemberProvider
                      .HasForeignKey(d => d.MemberId)  // 注意：這裡是 Id，不是 MemberId 透過 Id 欄位關聯
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
            modelBuilder.Entity<FavouriteVocabulary>(entity =>
            {
                entity.HasKey(e => new { e.MemberId, e.VocabularyId });

                entity.HasOne(f => f.Member)
                    .WithMany(m => m.FavouriteVocabulary)
                    .HasForeignKey(f => f.MemberId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(f => f.Vocabulary)
                    .WithMany(v => v.FavouritedBy)
                    .HasForeignKey(f => f.VocabularyId)
                    .OnDelete(DeleteBehavior.Cascade);

            });

            modelBuilder.Entity<VocabularyProgress>(entity =>
            {
                entity.HasKey(e => new { e.MemberId, e.VocabularyId });

                // 與 Members 的關係
                entity.HasOne(vp => vp.Member)
                    .WithMany(m => m.VocabularyProgress)
                    .HasForeignKey(vp => vp.MemberId)
                    .OnDelete(DeleteBehavior.Cascade);

                // 與 Vocabulary 的關係
                entity.HasOne(vp => vp.Vocabulary)
                    .WithMany(v => v.ProgressRecords)
                    .HasForeignKey(vp => vp.VocabularyId)
                    .OnDelete(DeleteBehavior.Cascade);

            });


        }
    }
}
