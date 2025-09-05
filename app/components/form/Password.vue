<script setup lang="ts">
import type { FormFieldState } from "@primevue/forms/form"
import type Password from "primevue/password"

const {
  name = "password",
  type = "password",
  placeholder = "",
  form,
} = defineProps<{
  name?: string
  type?: string
  placeholder?: string
  form: {
    register: (field: string, options: unknown) => unknown
    reset: () => void
    valid: boolean
  } & {
    [key: string]: FormFieldState
  }
}>()

const passwordField = useTemplateRef<InstanceType<typeof Password>>("passwordField")

const visibility = (isOk: boolean) => {
  return !isOk ? "invisible" : ""
}

defineExpose({
  passwordField,
})
</script>

<template>
  <Password
    ref="passwordField"
    :name
    :type
    :placeholder
    :toggle-mask="true"
    :form
    :pt="{
      pcInputText: {
        root: 'w-full'
      }
    }"
  >
    <template #footer>
      <Divider />
      <ul class="pl-2 my-0 leading-normal text-sm">
        <li class="flex items-center gap-1">
          <NuxtIcon
            name="cuida:check-outline"
            class="text-xl text-green-500"
            :class="visibility(/[a-z]/.test(form?.[name]?.value || ''))"
          />{{ $t('auth.login.passwordRequirements.lowercase') }}
        </li>
        <li class="flex items-center gap-1">
          <NuxtIcon
            name="cuida:check-outline"
            class="text-xl text-green-500"
            :class="visibility(/[A-Z]/.test(form?.[name]?.value || ''))"
          />{{ $t('auth.login.passwordRequirements.uppercase') }}
        </li>
        <li class="flex items-center gap-1">
          <NuxtIcon
            name="cuida:check-outline"
            class="text-xl text-green-500"
            :class="visibility(/\d/.test(form?.[name]?.value || ''))"
          />{{ $t('auth.login.passwordRequirements.numeric') }}
        </li>
        <li class="flex items-center gap-1">
          <NuxtIcon
            name="cuida:check-outline"
            class="text-xl text-green-500"
            :class="visibility(Boolean(form[name] && form[name].value.length >= 8))"
          />{{ $t('auth.login.passwordRequirements.minimumCharacters') }}
        </li>
      </ul>
    </template>
  </Password>
</template>