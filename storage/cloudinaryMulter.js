import multerPkg from "multer";
import cloudinary from "../lib/cloudinary.js";
import crypto from "crypto";

const { memoryStorage } = multerPkg;
const storage = memoryStorage();
export const upload = multerPkg({ storage,
  limits: { fileSize: 10 * 1024 * 1024 }

 });

export const multiUpload = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
]);

// Upload with deduplication and namespace (profile / cover)
const uploadToCloudinary = async (buffer, type = "generic") => {
  // Generate a hash of the buffer
  const hash = crypto.createHash("md5").update(buffer).digest("hex");

  // Namespace the public_id (profile_<hash> / cover_<hash>)
  const publicId = `${type}_${hash}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "uploads",
        timeout:60000,
        public_id: publicId,
        overwrite: false, // don’t overwrite if already exists
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary error:", error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};
export default uploadToCloudinary;