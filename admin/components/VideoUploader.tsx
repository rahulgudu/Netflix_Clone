"use client";
import useCurrentUser from "@/hooks/useCurrentUser";
import React, { useState } from "react";
import * as tus from "tus-js-client";

interface VideoUploaderProps {
  onSuccess?: (id: string) => void;
}

export default function VideoUploader({ onSuccess }: VideoUploaderProps) {
  const { data: currentUser } = useCurrentUser();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("Authorizing...");
    const response = await fetch(`/api/admin/create-upload?email=${currentUser?.email}`, {
      method: "POST",
      body: JSON.stringify({ title: file.name }),
      headers: { "Content-Type": "application/json" },
    });

    const { videoId, libraryId, expires, signature } = await response.json();

    const upload = new tus.Upload(file, {
      endpoint: "https://video.bunnycdn.com/tusupload",
      retryDelays: [0, 3000, 5000, 10000],
      headers: {
        AuthorizationSignature: signature,
        AuthorizationExpire: expires,
        VideoId: videoId,
        LibraryId: libraryId,
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        setProgress(Number(((bytesUploaded / bytesTotal) * 100).toFixed(2)));
        setStatus("Uploading...");
      },
      onSuccess: () => {
        setStatus("Success ✅");
        if (onSuccess) onSuccess(videoId);
      },
      onError: (error) => {
        console.error(error);
        setStatus("Failed ❌");
      },
    });
    upload.start();
  };

  return (
    <div className="w-full">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-[#1a1a1a] hover:bg-[#222]">
        <p className="text-sm text-gray-400">{status || "Click to upload video"}</p>
        <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
      </label>
      {progress > 0 && (
        <div className="mt-2 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
          <div className="bg-red-600 h-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
