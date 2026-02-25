import React, { useState } from "react";
import * as tus from "tus-js-client";

export default function VideoUploader() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus("Requesting upload permission...");

    // 1️⃣ Ask backend for upload permission
    const response = await fetch("http://localhost:8080/create-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: file.name }),
    });

    const { videoId, libraryId, expires, signature } = await response.json();

    setStatus("Starting upload...");

    // 2️⃣ Create TUS upload
    const upload = new tus.Upload(file, {
      endpoint: "https://video.bunnycdn.com/tusupload",
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
      headers: {
        AuthorizationSignature: signature,
        AuthorizationExpire: expires,
        VideoId: videoId,
        LibraryId: libraryId,
      },
      metadata: {
        filename: file.name,
        filetype: file.type,
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
        setStatus("Upload completed ✅");
        console.log("Video ID:", videoId);
      },
    });

    upload.start();
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Upload Large Video (20GB Safe)</h2>

      <input type="file" accept="video/*" onChange={handleFileChange} />

      <div style={{ marginTop: "20px" }}>
        <div>Progress: {progress}%</div>
        <div>{status}</div>
      </div>
    </div>
  );
}
