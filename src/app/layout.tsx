import type { Metadata, Viewport } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"] });
const workSans = Work_Sans({ variable: "--font-work-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  formatDetection: { telephone: false },
  openGraph: { type: "website", siteName: SITE.name, locale: "en_CA" },
  twitter: { card: "summary_large_image" },
  // Safari's Smart App Banner, once the app is on the App Store.
  ...(SITE.appStoreId && { itunes: { appId: SITE.appStoreId } }),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7FAF9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className={`${fraunces.variable} ${workSans.variable} antialiased`}>
      <body>
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-surface px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {/* The public site's chrome is in (site)/layout.tsx; the dashboard has its own. Each provides <main id="main">. */}
        {children}
      </body>
    </html>
  );
}
