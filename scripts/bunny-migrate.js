const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables manually from .env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (parts) {
      const key = parts[1];
      let value = parts[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const prisma = new PrismaClient();

// Helper to sign HLS URL
function signHlsUrl(videoId, securityKey, hostname) {
  // Use 100 years expiration so stored DB URLs don't break
  const expires = Math.floor(Date.now() / 1000) + (3600 * 24 * 365 * 100);
  const pathAllowed = `/${videoId}/`;
  const sortedParams = `token_path=${pathAllowed}`;
  const hashableBase = securityKey + pathAllowed + expires + "" + sortedParams;
  const hash = crypto.createHash("sha256").update(hashableBase).digest();
  const token = hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${hostname}/${videoId}/playlist.m3u8?token=${token}&expires=${expires}&token_path=${encodeURIComponent(pathAllowed)}`;
}

// Helper to extract Video ID from Bunny URL
function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\//i);
  return match ? match[1] : null;
}

// Main migration runner
async function migrate() {
  // NEW Bunny library config (loaded from env)
  const NEW_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
  const NEW_API_KEY = process.env.BUNNY_API_KEY;
  const NEW_CDN_TOKEN_KEY = process.env.BUNNY_CDN_TOKEN_KEY;
  const NEW_HOSTNAME = process.env.BUNNY_HOSTNAME;

  // OLD Bunny library details (for fetching and signing temporary URLs to let Bunny pull them)
  const OLD_CDN_TOKEN_KEY = process.env.OLD_BUNNY_CDN_TOKEN_KEY;
  const OLD_HOSTNAME = process.env.OLD_BUNNY_HOSTNAME;

  if (!NEW_LIBRARY_ID || !NEW_API_KEY || !NEW_CDN_TOKEN_KEY || !NEW_HOSTNAME) {
    console.error("Error: Please set BUNNY_LIBRARY_ID, BUNNY_API_KEY, BUNNY_CDN_TOKEN_KEY, and BUNNY_HOSTNAME in your environment or .env file before running.");
    process.exit(1);
  }

  if (!OLD_CDN_TOKEN_KEY || !OLD_HOSTNAME) {
    console.error("Error: Please specify OLD_BUNNY_CDN_TOKEN_KEY and OLD_BUNNY_HOSTNAME in your .env file to generate download URLs.");
    process.exit(1);
  }

  console.log("Starting migration. Target Library ID:", NEW_LIBRARY_ID);
  console.log("Please make sure 'MP4 Fallback' is enabled in your OLD Bunny.net library settings.");

  // 1. Migrate Movies
  const movies = await prisma.movie.findMany();
  console.log(`Found ${movies.length} movies to migrate...`);

  for (const movie of movies) {
    console.log(`\nProcessing movie: "${movie.title}"`);
    let updatedData = {};

    // Migrate Video URL
    if (movie.videoUrl) {
      const oldVideoId = extractVideoId(movie.videoUrl);
      if (oldVideoId) {
        console.log(`- Fetching video (ID: ${oldVideoId})...`);
        const mp4Url = signHlsUrl(oldVideoId, OLD_CDN_TOKEN_KEY, OLD_HOSTNAME).replace('playlist.m3u8', 'play_720p.mp4');
        
        try {
          const fetchRes = await fetch(`https://video.bunnycdn.com/library/${NEW_LIBRARY_ID}/videos/fetch`, {
            method: 'POST',
            headers: {
              'AccessKey': NEW_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              url: mp4Url,
              title: `${movie.title} - Video`
            })
          });

          const resData = await fetchRes.json();
          if (resData.success) {
            const newVideoId = resData.id || resData.guid || (resData.video ? resData.video.guid : null);
            if (newVideoId) {
              const newUrl = signHlsUrl(newVideoId, NEW_CDN_TOKEN_KEY, NEW_HOSTNAME);
              updatedData.videoUrl = newUrl;
              console.log(`  -> Successfully queued fetch. New Video ID: ${newVideoId}`);
            } else {
              console.log(`  -> Fetch queued, response:`, resData);
            }
          } else {
            console.error(`  -> Failed to queue fetch:`, resData.message || resData);
          }
        } catch (err) {
          console.error(`  -> Error calling Fetch API:`, err.message);
        }
      }
    }

    // Migrate Trailer URL
    if (movie.trailerUrl) {
      const oldTrailerId = extractVideoId(movie.trailerUrl);
      if (oldTrailerId) {
        console.log(`- Fetching trailer (ID: ${oldTrailerId})...`);
        const mp4Url = signHlsUrl(oldTrailerId, OLD_CDN_TOKEN_KEY, OLD_HOSTNAME).replace('playlist.m3u8', 'play_720p.mp4');

        try {
          const fetchRes = await fetch(`https://video.bunnycdn.com/library/${NEW_LIBRARY_ID}/videos/fetch`, {
            method: 'POST',
            headers: {
              'AccessKey': NEW_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              url: mp4Url,
              title: `${movie.title} - Trailer`
            })
          });

          const resData = await fetchRes.json();
          if (resData.success) {
            const newTrailerId = resData.id || resData.guid || (resData.video ? resData.video.guid : null);
            if (newTrailerId) {
              const newUrl = signHlsUrl(newTrailerId, NEW_CDN_TOKEN_KEY, NEW_HOSTNAME);
              updatedData.trailerUrl = newUrl;
              console.log(`  -> Successfully queued trailer fetch. New Video ID: ${newTrailerId}`);
            }
          } else {
            console.error(`  -> Failed to queue trailer fetch:`, resData.message || resData);
          }
        } catch (err) {
          console.error(`  -> Error calling Fetch API:`, err.message);
        }
      }
    }

    if (Object.keys(updatedData).length > 0) {
      await prisma.movie.update({
        where: { id: movie.id },
        data: updatedData
      });
      console.log(`Updated database record for movie "${movie.title}"`);
    }
  }

  // 2. Migrate Series Trailers
  const seriesList = await prisma.series.findMany();
  console.log(`\nFound ${seriesList.length} series to migrate...`);

  for (const series of seriesList) {
    if (series.trailerUrl) {
      console.log(`\nProcessing series trailer: "${series.title}"`);
      const oldTrailerId = extractVideoId(series.trailerUrl);
      if (oldTrailerId) {
        const mp4Url = signHlsUrl(oldTrailerId, OLD_CDN_TOKEN_KEY, OLD_HOSTNAME).replace('playlist.m3u8', 'play_720p.mp4');
        try {
          const fetchRes = await fetch(`https://video.bunnycdn.com/library/${NEW_LIBRARY_ID}/videos/fetch`, {
            method: 'POST',
            headers: {
              'AccessKey': NEW_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              url: mp4Url,
              title: `${series.title} - Trailer`
            })
          });

          const resData = await fetchRes.json();
          if (resData.success) {
            const newTrailerId = resData.id || resData.guid || (resData.video ? resData.video.guid : null);
            if (newTrailerId) {
              const newUrl = signHlsUrl(newTrailerId, NEW_CDN_TOKEN_KEY, NEW_HOSTNAME);
              await prisma.series.update({
                where: { id: series.id },
                data: { trailerUrl: newUrl }
              });
              console.log(`  -> Successfully updated series trailer. New ID: ${newTrailerId}`);
            }
          }
        } catch (err) {
          console.error(`  -> Error:`, err.message);
        }
      }
    }
  }

  // 3. Migrate Episodes
  const episodes = await prisma.episode.findMany({
    include: { season: { include: { series: true } } }
  });
  console.log(`\nFound ${episodes.length} episodes to migrate...`);

  for (const ep of episodes) {
    if (ep.videoUrl) {
      const seriesTitle = ep.season?.series?.title || 'Series';
      const epTitle = `${seriesTitle} - S${ep.season?.number || 1}E${ep.number || 1} - ${ep.title}`;
      console.log(`\nProcessing episode: "${epTitle}"`);
      const oldVideoId = extractVideoId(ep.videoUrl);
      if (oldVideoId) {
        const mp4Url = signHlsUrl(oldVideoId, OLD_CDN_TOKEN_KEY, OLD_HOSTNAME).replace('playlist.m3u8', 'play_720p.mp4');
        try {
          const fetchRes = await fetch(`https://video.bunnycdn.com/library/${NEW_LIBRARY_ID}/videos/fetch`, {
            method: 'POST',
            headers: {
              'AccessKey': NEW_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              url: mp4Url,
              title: epTitle
            })
          });

          const resData = await fetchRes.json();
          if (resData.success) {
            const newVideoId = resData.id || resData.guid || (resData.video ? resData.video.guid : null);
            if (newVideoId) {
              const newUrl = signHlsUrl(newVideoId, NEW_CDN_TOKEN_KEY, NEW_HOSTNAME);
              await prisma.episode.update({
                where: { id: ep.id },
                data: { videoUrl: newUrl }
              });
              console.log(`  -> Successfully updated episode. New ID: ${newVideoId}`);
            }
          }
        } catch (err) {
          console.error(`  -> Error:`, err.message);
        }
      }
    }
  }

  console.log("\nMigration completed successfully!");
}

migrate()
  .catch(err => {
    console.error("Migration error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
