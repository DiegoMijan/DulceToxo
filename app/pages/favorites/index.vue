<script setup lang="ts">
  defineI18nRoute({
    paths: {
      gl: "/favoritos",
      es: "/favoritos",
      en: "/favorites",
    },
  })

  definePageMeta({
    middleware: "auth",
  })

  const { favoritesIndexPath } = useFavoritesPath()

  await navigateTo(favoritesIndexPath(), { replace: true })
</script>
