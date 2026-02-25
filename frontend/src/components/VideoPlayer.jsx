import React, { useEffect, useState } from "react";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  PlyrLayout,
  plyrLayoutIcons,
} from "@vidstack/react/player/layouts/plyr";

import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";

export default function VideoPlayer({ videoId }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpc1N1YnNjcmliZWQiOnRydWUsImlhdCI6MTc3MjAzMTc5MiwiZXhwIjoxNzcyMDM1MzkyfQ.9ZokNyguDTB9hUxZM2n6qrf2_EwAL_gpYHT4uPCAcPg";
    const fetchVideo = async () => {
      const response = await fetch(`http://localhost:8080/video/${videoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { url } = await response.json();
      setUrl(url);
    };

    fetchVideo();
  }, [videoId]);
  console.log(url);

  if (!url) return <div>Loading...</div>;

  return (
    <MediaPlayer title="Video Player" src={url}>
      <MediaProvider />
      <PlyrLayout icons={plyrLayoutIcons} />
    </MediaPlayer>
  );
}
