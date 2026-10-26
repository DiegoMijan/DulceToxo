import { Hono } from "hono"
import { v2 as cloudinary } from "cloudinary"
import { requireAdmin } from "../middleware/auth"

const app = new Hono()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// POST /uploads - Upload image to Cloudinary (admin only)
app.post("/", requireAdmin, async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get("file") as File | null
    
    if (!file) {
      return c.json({ error: "Bad Request", message: "No file provided" }, 400)
    }
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const dataUri = `data:${file.type};base64,${base64}`
    
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "dulcetoxo/recipes",
      resource_type: "image",
    })
    
    return c.json({
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return c.json({ error: "Internal Server Error", message: "Failed to upload image" }, 500)
  }
})

// DELETE /uploads/:publicId - Delete image from Cloudinary (admin only)
app.delete("/:publicId", requireAdmin, async (c) => {
  try {
    const publicId = c.req.param("publicId")
    
    await cloudinary.uploader.destroy(publicId)
    
    return c.json({ message: "Image deleted successfully" })
  } catch (error) {
    console.error("Delete error:", error)
    return c.json({ error: "Internal Server Error", message: "Failed to delete image" }, 500)
  }
})

export default app
