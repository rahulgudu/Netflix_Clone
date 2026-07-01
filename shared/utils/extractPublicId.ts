// utils/extractPublicId.ts
export const extractPublicId = (url: string): string => {
  const cleanUrl = url.split("?")[0];
  const withoutExt = cleanUrl.replace(/\.[^/.]+$/, "");
  return withoutExt.split("/upload/")[1].replace(/^v\d+\//, "");
};
