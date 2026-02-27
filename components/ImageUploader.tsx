import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import { useEffect, useState } from "react";
import { useMediaStore } from "@/zustand/states/useMediaStore";

export default function ImageUploader() {
    const [status, setStatus] = useState<string>("");
    const setThumbnailUrl = useMediaStore((state) => state.setThumbnailUrl);
    const { thumbnailUrl } = useMediaStore();

    useEffect(() => {
        if (thumbnailUrl) {
            setStatus("Image uploaded successfully! ✅");
        }
    }, [thumbnailUrl])

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setStatus("Uploading image...");

            const thumbnailUrl = await uploadToCloudinary(file);

            setStatus("Image uploaded successfully! ✅");
            console.log("Uploaded thumbnail URL:", thumbnailUrl);
            setThumbnailUrl(thumbnailUrl as any);
        } catch (error) {
            console.error("Error uploading image:", error);
            setStatus("Image upload failed ❌");
        }
    };

    return (
        <div className="w-full">
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-[#1a1a1a] hover:bg-[#222] transition">
                <div className="flex flex-col items-center justify-center">
                    <svg
                        className="w-8 h-8 mb-2 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16l4-4a3 3 0 014 0l4 4m-2-2l1.5-1.5a3 3 0 014 0L21 16m-9-12h.01M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <p className="text-sm text-gray-400">
                        Click to upload thumbnail
                    </p>
                </div>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </label>

            {status && (
                <p className="mt-3 text-sm text-gray-400">{status}</p>
            )}
        </div>
    );
}