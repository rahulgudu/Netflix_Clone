export const uploadToCloudinary = async (file: File) => {
  console.log("here");

  const formData = new FormData();

  formData.append("file", file);

  formData.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string,
  );

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    }/auto/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!res.ok) throw new Error("Upload failed");

  const data = await res.json();

  return data.secure_url as string;
};
