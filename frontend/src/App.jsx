import React from "react";
import VideoUploader from "./components/VideoUploader";
import VideoPlayer from "./components/VideoPlayer";

const App = () => {
  return (
    <div>
      <VideoUploader />
      <VideoPlayer videoId="600a3821-204c-45d2-bcb2-9fd5648e39eb" />
      <VideoPlayer videoId="d2ceb5c4-6f8e-4893-917e-c4299acee73e" />
    </div>
  );
};

export default App;
