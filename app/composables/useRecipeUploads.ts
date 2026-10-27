import type { components } from "#shared/types/api"

export const RECIPE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024
export const RECIPE_UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp"
export const RECIPE_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

export type RecipeUploadResult = components["schemas"]["UploadResult"]
export type DeleteUploadResponse = components["schemas"]["DeleteUploadResponse"]

export const useRecipeUploads = () => {
  const { t } = useI18n()
  const toast = useToast()

  const uploadImage = async (file: File): Promise<RecipeUploadResult | null> => {
    if (!RECIPE_UPLOAD_TYPES.includes(file.type as (typeof RECIPE_UPLOAD_TYPES)[number])) {
      toast.add({
        severity: "error",
        summary: t("upload.invalidType"),
        life: 5000,
      })
      return null
    }

    if (file.size > RECIPE_UPLOAD_MAX_BYTES) {
      toast.add({
        severity: "error",
        summary: t("upload.tooLarge"),
        life: 5000,
      })
      return null
    }

    const body = new FormData()
    body.append("file", file)

    try {
      const result = await $fetch<RecipeUploadResult>("/api/uploads", {
        method: "POST",
        body,
      })

      toast.add({
        severity: "success",
        summary: t("upload.success"),
        life: 3000,
      })

      return result
    } catch (error) {
      toast.add({
        severity: "error",
        summary: t("upload.error"),
        life: 5000,
      })
      console.error("Failed to upload image:", error)
      return null
    }
  }

  const deleteUpload = async (publicId: string): Promise<boolean> => {
    try {
      await $fetch<DeleteUploadResponse>(`/api/uploads/${publicId}`, {
        method: "DELETE",
      })
      return true
    } catch (error) {
      console.error("Failed to delete uploaded image:", error)
      return false
    }
  }

  return {
    uploadImage,
    deleteUpload,
  }
}
