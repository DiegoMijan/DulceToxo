export const useForm = <T>(initialValues: T) => {
   const reactiveForm = ref<T>( { ...initialValues })

   const reset = () => {
    reactiveForm.value = { ...initialValues }
   }

   return { reactiveForm, reset, }
}