import { ImageResponse } from "next/og";
import { AppIconArt } from "@/components/brand/AppIconArt";

// iPhone home-screen and bookmark icon. Square, because iOS rounds the corners.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconArt size={180} />, size);
}
