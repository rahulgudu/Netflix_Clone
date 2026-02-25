# Video Streaming Platform

A production-ready video streaming backend built with:

- **Node.js**
- **Bunny.net (Storage + Stream + CDN)**
- **HLS (Adaptive Streaming)**
- **JWT Authentication**
- **Short-Lived Signed URLs**
- **Large File (20GB) Direct Upload**
- **Resumable Upload (TUS Protocol)**

This project demonstrates how to build a scalable, secure, cloud-based streaming architecture similar to Netflix.

---

# 🚀 Features

- ✅ Direct large video uploads (up to 20GB)
- ✅ No local file storage (no `fs`)
- ✅ Resumable uploads (network drop safe)
- ✅ Automatic transcoding to HLS
- ✅ Adaptive streaming playback
- ✅ JWT-based access control
- ✅ Short-lived signed CDN URLs
- ✅ Expiring playback links
- ✅ Secure content delivery

---

# 🏗 Architecture Overview

## 1️⃣ Upload Flow (Large File Safe)

Frontend → Backend → Bunny Stream (TUS)

1. Frontend requests upload permission from backend.
2. Backend creates video entry in Bunny Stream.
3. Frontend uploads directly to Bunny using TUS (resumable).
4. No file buffering in Node.
5. No local disk storage.

### Result
- 3.5GB (2+ hour) movie successfully uploaded.
- Upload resumes automatically if network drops.
- Server memory usage stays stable.

---

## 2️⃣ Processing Flow

After upload completes, Bunny Stream:

- Extracts metadata
- Transcodes video
- Generates multiple resolutions
- Creates HLS segments
- Generates thumbnails
- Prepares `.m3u8` playlist

Dashboard status:
- `Processing` → `Ready`

Processing time for 2h 1080p movie: ~5–20 minutes.

---

## 3️⃣ Playback Flow

Frontend:
GET /video/:id


Backend:

1. Verify JWT
2. Fetch video metadata from database
3. Generate short-lived signed HLS URL
4. Return signed URL

Frontend:

- Uses Vidstack player
- Loads signed `.m3u8`
- Streams via HLS

---

# 🔐 Security Architecture

## ✅ JWT Authentication

- User must be authenticated.
- Backend verifies token before generating video URL.

---

## ✅ Pull Zone Token Authentication

CDN requires:

- `token`
- `expires`
- `token_path`

If invalid or expired:
- CDN returns `403 Forbidden`.

---

## ✅ Short-Lived Signed URLs

Example:

```js
const expires = Math.floor(Date.now() / 1000) + 20;
```

Behavior:

Already buffered segments continue playing.

New segment requests after expiry return 403.

Direct link sharing fails after expiration.

# ✅ Block Direct URL Access

Prevents hotlinking and public embedding.

🎥 HLS Streaming Details

Adaptive bitrate streaming

.m3u8 master playlist

.ts segments

CDN edge caching

Secure signed segment access

Tested scenarios:

Seek forward/backward

Refresh mid-play

Expiry validation

2-hour 1080p movie playback

3.5GB file handling

Expiration test (20-second signed URLs)

📂 Large File Handling

Tested with:

3.5GB

2h 21m

1080p H264

EAC3 Audio

Upload Method:

TUS resumable protocol

Chunk-based

No server memory load

No fs usage

Result:

Stable

Resume works

No crashes

🎯 Key Technical Decisions
❌ No Local Storage

Node server does not store video files.

❌ No Signed URL Storage

Signed URLs are temporary and generated dynamically.

✅ Cloud-Only Architecture

All video assets live in Bunny Stream + CDN.

✅ Backend-Controlled Access

Frontend never exposes permanent video URLs.

📊 Tech Stack
Backend

Node.js

Express

JWT

Crypto (SHA256)

Bunny Stream API

Frontend

React

Vidstack Player

HLS Streaming

Infrastructure

Bunny.net

Storage Zone

Stream Library

Pull Zone

CDN Token Authentication

🧪 Expiry Behavior Explained

Even with 20-second expiry:

Player buffers multiple segments ahead.

Already downloaded segments continue playing.

New segment requests after expiry return 403.

This is correct HLS behavior.

📈 Future Improvements

🔁 Auto-refresh signed URLs

⏱ Save watch progress

🎬 Resume playback

💳 Subscription-based access

📺 Series / seasons / episodes structure

📊 Analytics tracking

🔒 DRM integration

🌍 Multi-audio selection

💬 Subtitle management

🧾 Per-user watermarking

🏆 Final Result

This project successfully demonstrates:

Production-scale upload system

Secure HLS streaming

Signed CDN protection

Expiring playback links

Backend authentication layer

Real production-ready streaming pipeline

This is a full cloud-native streaming architecture foundation.



# APIS from Bunny.net
## Storage
```bash
Storage API Key = 9acce653-98e0-4457-92a5d33d8460-815f-4417
```
```bash
Storage Base URL = https://storage.bunnycdn.com/video-storage-netflix/
```
```bash 
Storage CDN = https://netflix-cdn.b-cdn.net/
```
## Stream
```bash 
STREAM_LIBRARY_ID = 605726
```
```bash 
STREAM_API_KEY = 3f3f9546-0f29-419c-ae6232acf5e9-624e-45ea
```



---

