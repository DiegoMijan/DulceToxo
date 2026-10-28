export type HighlightSegment = {
  text: string
  match: boolean
}

export const foldSearchText = (text: string): string =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()

export const extractSearchWords = (query: string): string[] =>
  foldSearchText(query)
    .split(/\s+/)
    .filter((word) => word.length >= 2)

const foldWithIndexMap = (text: string): { folded: string; indexMap: number[] } => {
  let folded = ""
  const indexMap: number[] = []

  for (let index = 0; index < text.length; index += 1) {
    const foldedChar = foldSearchText(text[index] ?? "")
    for (let charIndex = 0; charIndex < foldedChar.length; charIndex += 1) {
      folded += foldedChar[charIndex]
      indexMap.push(index)
    }
  }

  return { folded, indexMap }
}

const mergeRanges = (
  ranges: Array<{ start: number; end: number }>,
): Array<{ start: number; end: number }> => {
  if (ranges.length === 0) return []

  const sorted = [...ranges].sort((left, right) => left.start - right.start || left.end - right.end)
  const merged = [{ ...sorted[0]! }]

  for (const range of sorted.slice(1)) {
    const last = merged[merged.length - 1]!
    if (range.start <= last.end) {
      last.end = Math.max(last.end, range.end)
      continue
    }
    merged.push({ ...range })
  }

  return merged
}

const collectMatchRanges = (
  text: string,
  words: string[],
): Array<{ start: number; end: number }> => {
  const { folded, indexMap } = foldWithIndexMap(text)
  const ranges: Array<{ start: number; end: number }> = []

  for (const word of words) {
    let from = 0
    while (from <= folded.length - word.length) {
      const found = folded.indexOf(word, from)
      if (found === -1) break

      const start = indexMap[found] ?? 0
      const lastFoldedIndex = found + word.length - 1
      const end = (indexMap[lastFoldedIndex] ?? text.length - 1) + 1
      ranges.push({ start, end })
      from = found + word.length
    }
  }

  return mergeRanges(ranges)
}

export const highlightMatches = (text: string, query: string): HighlightSegment[] => {
  const words = extractSearchWords(query)
  if (!text || words.length === 0) return [{ text, match: false }]

  const ranges = collectMatchRanges(text, words)
  if (ranges.length === 0) return [{ text, match: false }]

  const segments: HighlightSegment[] = []
  let cursor = 0

  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({ text: text.slice(cursor, range.start), match: false })
    }
    segments.push({ text: text.slice(range.start, range.end), match: true })
    cursor = range.end
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), match: false })
  }

  return segments
}
