export const hasRecipeVotes = (ratingAvg: number | null, ratingCount: number): boolean =>
  ratingAvg != null && ratingCount > 0

export const formatRatingAverage = (ratingAvg: number, locale: string): string => {
  const [integer, fraction] = ratingAvg.toFixed(1).split(".")
  const decimal = locale === "en" ? "." : ","
  return `${integer}${decimal}${fraction}`
}

export const formatRatingSummary = (
  ratingAvg: number,
  ratingCount: number,
  locale: string,
): string => `${formatRatingAverage(ratingAvg, locale)} (${ratingCount})`

export const ratingStarsValue = (ratingAvg: number | null): number => {
  if (ratingAvg == null) return 0
  return Math.round(ratingAvg * 2) / 2
}
