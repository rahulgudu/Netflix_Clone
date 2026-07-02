// services/deleteFromCloudinary.ts

import cloudinary from "@/utils/cloudinary_config";
import { extractPublicId } from "@/utils/extractPublicId";

export const deleteFromCloudinary = async (url?: string | null) => {
  if (!url) return { skipped: true };

  const publicId = extractPublicId(url);

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

  return result;
};
