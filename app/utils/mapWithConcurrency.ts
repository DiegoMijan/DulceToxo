export const mapWithConcurrency = async <T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal,
): Promise<R[]> => {
  const results: R[] = Array.from({ length: items.length })
  let nextIndex = 0

  const worker = async (): Promise<void> => {
    while (true) {
      throwIfAborted(signal)
      const index = nextIndex
      nextIndex += 1
      if (index >= items.length) return
      results[index] = await mapper(items[index] as T, index)
    }
  }

  if (items.length === 0) return results

  const workerCount = Math.min(Math.max(concurrency, 1), items.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  throwIfAborted(signal)
  return results
}
