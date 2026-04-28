// src/config/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { AppError } from "../utils/AppError";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type '${file.mimetype}' not allowed`, 400));
    }
  },
});

// cloudinary.ts
export async function uploadToCloudinary(buffer: Buffer, folder = "sessions") {
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" }, // "auto" → "image"
      (err, result) => {
        if (err) {
          console.error("Cloudinary Error:", err);
          return reject(new AppError(err.message || "Upload failed", 500));
        }
        if (!result) return reject(new AppError("No result from Cloudinary", 500));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}