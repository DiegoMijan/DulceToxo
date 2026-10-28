import brownie from "@/../public/img/brownie.webp"
import darkBrownie from "@/../public/img/dark_brownie.webp"

export type CategoryIcon = {
  icon: string
  darkIcon?: string
  isImage?: boolean
}

const CATEGORY_ICONS: Record<string, CategoryIcon> = {
  cupcakes: { icon: "fluent-emoji:cupcake", darkIcon: "twemoji:cupcake" },
  cookies: { icon: "twemoji:cookie", darkIcon: "unjs:cookie-es" },
  cheesecakes: { icon: "noto:shortcake", darkIcon: "emojione:shortcake" },
  "sponge-cakes": { icon: "logos:cakephp-icon", darkIcon: "streamline-emojis:birthday-cake-3" },
  brownies: { icon: brownie, darkIcon: darkBrownie, isImage: true },
  "cold-cakes": { icon: "emojione-v1:shortcake", darkIcon: "streamline-emojis:shortcake-1" },
  "layer-cakes": { icon: "fluent-emoji:birthday-cake", darkIcon: "twemoji:birthday-cake" },
  "ice-cream": { icon: "fluent-emoji:ice-cream", darkIcon: "streamline-emojis:soft-ice-cream-1" },
  classics: { icon: "fluent-emoji:pancakes", darkIcon: "twemoji:pancakes" },
}

const FALLBACK_ICON: CategoryIcon = { icon: "fluent-emoji:shortcake" }

export const getCategoryIcon = (categoryId: string): CategoryIcon =>
  CATEGORY_ICONS[categoryId] ?? FALLBACK_ICON
