<!-- eslint-disable vue/no-v-html -->
<script lang="ts" setup>
defineEmits(["close"])

const calculateYears = (birthDate: Date): number => {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const month = today.getMonth() - birthDate.getMonth()

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

const birthDate = new Date(1993, 9, 11)
const age = calculateYears(birthDate)
</script>

<template>
  <div
    class="fixed inset-0 flex items-center justify-center z-50"
    style="background-color: rgba(0, 0, 0, 0.5);"
    data-blendy-to="profile"
  >
    <div class="dark:bg-gray-900! bg-french-lilac-400 rounded-lg shadow-lg p-6 w-full max-w-md">
      <div class="flex justify-between items-center border-b pb-3">
        <h2 class="text-xl font-semibold  font-[Playfair_Display] ">
          {{ $t('aboutMeDialog.title') }}
        </h2>
        <button
          class="text-gray-500 hover:text-gray-700 cursor-pointer"
          @click="$emit('close')"
        >
          <i
            class="pi pi-times"
          />
        </button>
      </div>
      <div
        class="mt-4 font-[Lato]"
      >
        <LandingProfileImage show-gradient />
        <p class="max-w-[60ch] content">
          {{ $t('aboutMeDialog.greeting', { age }) }}
          {{ $t('aboutMeDialog.introduction') }}<br>
          <span v-html="$t('aboutMeDialog.business')" /><br>
          {{ $t('aboutMeDialog.cupcakes') }} <br>
          {{ $t('aboutMeDialog.cookies') }}<br>
          {{ $t('aboutMeDialog.cheesecakes') }}<br>
          {{ $t('aboutMeDialog.more') }}
        </p>
      </div>
    </div>
  </div>
</template>
