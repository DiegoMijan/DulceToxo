<script setup lang="ts">
import { createBlendy, type Blendy } from 'blendy'

const blendy = ref<Blendy | null>(null)
const showModal = ref(false)

onMounted(() => {
  blendy.value = createBlendy()
})
</script>

<template>
  <Teleport to="body">
    <LandingProfileModal
      v-if="showModal"
      @close="() => {
        blendy?.untoggle('profile', () => {
          showModal = false
        })
      }"
    />
  </Teleport>
  <button
    class="button"
    data-blendy-from="profile"
    @click="() => {
      showModal = true
      blendy?.toggle('profile')
    }"
  >
    <img

      src="/public/img/lucia.jpg"
      alt="Lucia"
      class="rounded-full overflow-hidden relative mx-auto cursor-pointer button"
      width="150"
    >
  </button>
</template>
