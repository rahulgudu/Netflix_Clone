import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import crypto from "crypto";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // 🔥 IMPORTANT

app.get("/", (req, res) => {
  const token = jwt.sign(
    {
      userId: "123",
      isSubscribed: true,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );

  return res.json({
    message: "Server running",
    token,
  });
});

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function signHlsUrl(videoId) {
  const securityKey = process.env.BUNNY_CDN_TOKEN_KEY;
  const hostname = "https://vz-fab0faab-054.b-cdn.net";

  const expires = Math.floor(Date.now() / 1000) + 20;
  const pathAllowed = `/${videoId}/`;

  // Sorted params (only token_path in your case)
  const sortedParams = `token_path=${pathAllowed}`;

  const hashableBase =
    securityKey + pathAllowed + expires + "" + sortedParams;

  const hash = crypto.createHash("sha256").update(hashableBase).digest();

  const token = hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${hostname}/${videoId}/playlist.m3u8?token=${token}&expires=${expires}&token_path=${encodeURIComponent(pathAllowed)}`;
}

app.get("/video/:videoId", authenticate, (req, res) => {
  const videoId = req.params.videoId;
  // const securityKey = process.env.BUNNY_CDN_TOKEN_KEY;

  // const expires = Math.floor(Date.now() / 1000) + 300;
  // const pathAllowed = `/${videoId}/`;

  // const stringToHash = securityKey + pathAllowed + expires;

  // console.log("PATH:", pathAllowed);
  // console.log("EXPIRES:", expires);
  // console.log("STRING TO HASH:", stringToHash);

  // const hash = crypto
  //   .createHash("sha256")
  //   .update(stringToHash)
  //   .digest();

  // const token = hash
  //   .toString("base64")
  //   .replace(/\+/g, "-")
  //   .replace(/\//g, "_")
  //   .replace(/=+$/, "");

  // const finalUrl =
  //   `https://vz-fab0faab-054.b-cdn.net/${videoId}/playlist.m3u8` +
  //   `?token=${token}&expires=${expires}&token_path=${encodeURIComponent(pathAllowed)}`;

  // console.log("FINAL URL:", finalUrl);
  const finalUrl = signHlsUrl(videoId);
  console.log(finalUrl);
  

  res.json({ url: finalUrl });
});

app.post("/create-upload", async (req, res) => {
  try {
    const { title } = req.body;

    const videoResponse = await axios.post(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos`,
      { title },
      {
        headers: {
          AccessKey: process.env.BUNNY_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    const videoId = videoResponse.data.guid;

    const expires = Math.floor(Date.now() / 1000) + 3600;

    const signature = crypto
      .createHash("sha256")
      .update(
        process.env.BUNNY_LIBRARY_ID +
          process.env.BUNNY_API_KEY +
          expires +
          videoId,
      )
      .digest("hex");

    res.json({
      videoId,
      libraryId: process.env.BUNNY_LIBRARY_ID,
      expires,
      signature,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to initialize upload" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
