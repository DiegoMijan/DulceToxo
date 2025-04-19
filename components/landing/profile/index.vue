<script setup lang="ts">
import { createBlendy, type Blendy } from 'blendy'

const emit = defineEmits(['toggleModal'])

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
          emit('toggleModal', false)
        })
      }"
    />
  </Teleport>
  <button
    class="button"
    data-blendy-from="profile"
    @click="() => {
      showModal = true
      emit('toggleModal', true)
      blendy?.toggle('profile')
    }"
  >
    <LandingProfileImage
      show-gradient
      class="button cursor-pointer"
    />
  </button>
</template>
