export const reactiveTranslation = (key: string) => {
  const { t } = useI18n()
  return computed(() => t(key)) as unknown as string
}
