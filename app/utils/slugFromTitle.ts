export const slugFromTitle = (title: string): string => {
  const withoutMarks = title.normalize("NFD").replace(/\p{M}/gu, "")
  const kebab = withoutMarks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
  return kebab.replace(/^-+|-+$/g, "")
}
