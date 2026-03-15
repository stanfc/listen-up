/**
 * Crawler configuration
 */

export const YEAR_START = 1940
export const YEAR_END = 2026

// Max songs per single artist in entire playlist (for diversity)
export const MAX_SONGS_PER_ARTIST = 3

// How many songs to target per year
export function getSongsPerYear(year) {
  if (year >= 1990 && year <= 2015) return 5    // 黃金年代
  if (year >= 1980 && year <= 1989) return 3    // 主要範圍
  if (year >= 1970 && year <= 1979) return 2    // 早期經典
  if (year >= 2016 && year <= 2026) return 5    // 近年
  return 1                                       // 1940-1969
}

// Difficulty by decade
export function getDifficulty(year) {
  if (year >= 2000) return 'easy'
  if (year >= 1980) return 'medium'
  return 'hard'
}

// Tags derived from year
export function getYearTag(year) {
  const decade = Math.floor(year / 10) * 10
  return `${decade}s`
}
