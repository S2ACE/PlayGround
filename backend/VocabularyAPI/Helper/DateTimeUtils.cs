namespace VocabularyAPI.Helper
{
    public static class DateTimeUtils
    {
        public static DateTime ParseLoginTime(string lastLoginAt)
        {
            if (DateTime.TryParse(
                lastLoginAt,
                null,
                System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal,
                out var dateTime))
            {
                return DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
            }
            if (long.TryParse(lastLoginAt, out var unixTimestamp))
            {
                return DateTimeOffset.FromUnixTimeMilliseconds(unixTimestamp).UtcDateTime;
            }
            throw new ArgumentException($"無法解析日期格式: {lastLoginAt}");
        }
    }
}
