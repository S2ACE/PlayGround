namespace VocabularyAPI.Helper
{
    /// <summary>
    /// Utility methods for parsing login time strings into UTC DateTime values.
    /// </summary>
    public static class DateTimeUtils
    {
        public static DateTime ParseLoginTime(string lastLoginAt)
        {
            // Try parse ISO-8601 or culture-dependent date string as UTC.
            if (DateTime.TryParse(
                lastLoginAt,
                null,
                System.Globalization.DateTimeStyles.AssumeUniversal |
                System.Globalization.DateTimeStyles.AdjustToUniversal,
                out var dateTime))
            {
                return DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
            }

            // Fallback: treat the value as Unix timestamp in milliseconds.
            if (long.TryParse(lastLoginAt, out var unixTimestamp))
            {
                return DateTimeOffset.FromUnixTimeMilliseconds(unixTimestamp).UtcDateTime;
            }

            throw new ArgumentException($"Unable to parse date value: {lastLoginAt}");
        }
    }
}