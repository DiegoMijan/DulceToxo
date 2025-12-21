interface FormStates {
  [key: string]: Record<string, unknown>
}

interface FormInstance {
  states: FormStates
  reset: () => void
}

export const useStateForm = (formName: string) => {
  const form = useTemplateRef<FormInstance>(formName)

  const checkObjectIsDirty = (
    object: Record<string, unknown>,
    property: "dirty" | "pristine",
  ): boolean => {
    if (property in object) {
      return Boolean(object[property])
    }

    return Object.values(object).some((value) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return checkObjectIsDirty(value as Record<string, unknown>, property)
      }
      return false
    })
  }

  const formStates = computed(() => {
    if (!form.value) return { isDirty: false, isPristine: false }

    const { states } = form.value
    const isDirty = Object.values(states).some((state) => checkObjectIsDirty(state, "dirty"))
    const isPristine = Object.values(states).some((state) => checkObjectIsDirty(state, "pristine"))

    return { isDirty, isPristine }
  })

  const resetForm = () => {
    form.value?.reset()
  }

  return {
    form,
    formStates,
    resetForm,
  }
}
