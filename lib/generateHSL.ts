import crypto from "crypto";
export default async function signHlsUrl(videoId: string) {
    const securityKey = process.env.BUNNY_CDN_TOKEN_KEY;
    const hostname = process.env.BUNNY_HOSTNAME;

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