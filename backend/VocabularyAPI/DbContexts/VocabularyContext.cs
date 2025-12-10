using Microsoft.EntityFrameworkCore;
using VocabularyAPI.Models;

namespace VocabularyAPI.DbContexts
{
    /// <summary>
    /// Entity Framework Core database context for vocabulary, members, favourites and progress tracking.
    /// </summary>
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

            // Configure MemberProviders entity (composite key and relationships).
            modelBuilder.Entity<MemberProviders>(entity =>
            {
                // Composite primary key.
                entity.HasKey(e => new { e.MemberId, e.Provider });

                // Relationship: MemberProviders → Members (many-to-one).
                entity.HasOne(d => d.Member)
                      .WithMany(p => p.Providers)
                      .HasForeignKey(d => d.MemberId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            /*
            // Alternative configuration from Members (principal entity).
            modelBuilder.Entity<Members>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasMany(p => p.Providers)
                      .WithOne(d => d.Member)
                      .HasForeignKey(d => d.Id)
                      .OnDelete(DeleteBehavior.Cascade);
            });
            */

            // Configure FavouriteVocabulary join entity.
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

            // Configure VocabularyProgress entity.
            modelBuilder.Entity<VocabularyProgress>(entity =>
            {
                entity.HasKey(e => new { e.MemberId, e.VocabularyId });

                // Relationship with Members.
                entity.HasOne(vp => vp.Member)
                    .WithMany(m => m.VocabularyProgress)
                    .HasForeignKey(vp => vp.MemberId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relationship with Vocabulary.
                entity.HasOne(vp => vp.Vocabulary)
                    .WithMany(v => v.ProgressRecords)
                    .HasForeignKey(vp => vp.VocabularyId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}