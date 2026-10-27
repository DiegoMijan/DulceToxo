export const hasRecipeVotes = (ratingAvg: number | null, ratingCount: number): boolean =>
  ratingAvg != null && ratingCount > 0

export const formatRatingAverage = (ratingAvg: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(ratingAvg)

export const formatRatingSummary = (
  ratingAvg: number,
  ratingCount: number,
  locale: string,
): string => `${formatRatingAverage(ratingAvg, locale)} (${ratingCount})`

export const ratingStarsValue = (ratingAvg: number | null): number => {
  if (ratingAvg == null) return 0
  return Math.round(ratingAvg * 2) / 2
}
