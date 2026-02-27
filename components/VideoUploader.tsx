
"use client"
import useCurrentUser from "@/hooks/useCurrentUser";
import { useMediaStore } from "@/zustand/states/useMediaStore";
import React, { useEffect, useState } from "react";
import * as tus from "tus-js-client";
export default function VideoUploader() {
    const { data: currentUser } = useCurrentUser();
    const setVideoId = useMediaStore((state: any) => state.setVideoId);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("");
    const { videoId } = useMediaStore();
    

    useEffect(() => {
        if(videoId) {
            setStatus("Video uploaded successfully! 🎉");
            setProgress(100);
        }
    }, [videoId])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus("Requesting upload permission...");
        // upload code later
        const response = await fetch(`/api/admin/create-upload?email=${currentUser?.email}`,
            {
                method: "POST",
                body: JSON.stringify({ title: file.name }),
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const { videoId, libraryId, expires, signature } = await response.json()

        setStatus("Uploading video...");

        // Create TUS Upload
        const upload = new tus.Upload(file, {
            endpoint: "https://video.bunnycdn.com/tusupload",
            retryDelays: [0, 3000, 5000, 10000, 20000],
            chunkSize: 5 * 1024 * 1024,
            headers: {
                AuthorizationSignature: signature,
                AuthorizationExpire: expires,
                VideoId: videoId,
                LibraryId: libraryId,
            },
            metadata: {
                filename: file.name,
                filetype: file.type
            },
            onError: function (error) {
                console.error("Upload failed:", error);
                setStatus("Upload failed ❌");
            },
            onProgress: function (bytesUploaded, bytesTotal) {
                const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
                setProgress(Number(percentage));
            },
            onSuccess: function () {
                setStatus("Upload successful ✅");
                console.log("VideoId", videoId);
                setVideoId(videoId);
            }
        });
        upload.start();
    }
    return (
        <div className="w-full">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-[#1a1a1a] hover:bg-[#222] transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                        className="w-10 h-10 mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 16V4m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                        />
                    </svg>
                    <p className="text-sm text-gray-400">
                        Click to upload video
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        MP4, MOV supported
                    </p>
                </div>
                <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                />
            </label>

            {progress > 0 && (
                <div className="mt-4">
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-red-600 h-2 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs mt-2 text-gray-400">
                        <span>{progress}%</span>
                        <span>{status}</span>
                    </div>
                </div>
            )}
        </div>
    );
}