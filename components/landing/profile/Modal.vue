<script lang="ts" setup>
defineEmits(['close'])

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
    class="fixed inset-0 flex items-center justify-center"
    style="background-color: rgba(0, 0, 0, 0.5);"
    data-blendy-to="profile"
  >
    <div class="dark:bg-gray-900! bg-french-lilac-400 rounded-lg shadow-lg p-6 w-full max-w-md">
      <div class="flex justify-between items-center border-b pb-3">
        <h2 class="text-xl font-semibold  font-[Playfair_Display] ">
          Sobre mi
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
        <img

          src="/public/img/lucia.jpg"
          alt="Lucia"
          class="rounded-full overflow-hidden relative mx-auto"
          width="150"
        >
        <p class="max-w-[60ch]">
          Hola, mi nombre es Lucia Chas Álvarez. Tengo {{ age }} años y soy ingeniera software. Aunque si estás aquí, no es por la informática 😂😂, sino por una de mis grandes pasiones, como es la repostería.
          En <i class="font-bold dark:text-french-lilac-400! text-french-lilac-200">Dulce Toxo</i> podrás encontrar una amplia variedad de postres artesanales y dulces como:<br>
          🧁 Cupcakes <br>
          🍪 Cookies<br>
          🍰 Tartas de queso<br>
          Y más!
        </p>
      </div>
    </div>
  </div>
</template>
