export const useForm = <T>(initialValues: T) => {
  const reactiveForm = ref<T>(structuredClone(initialValues))

  const reset = () => {
    reactiveForm.value = structuredClone(initialValues)
  }

  return { reactiveForm, reset }
}
