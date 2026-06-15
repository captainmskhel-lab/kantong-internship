import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontHeading, fontBody } from "@/lib/fonts";
import { ToastProvider } from "@/components/ui/toast";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "Kantong Internship",
  description:
    "Catat, pantau, dan laporkan kas internship dengan lebih rapi. RSUD Kabanjahe • Puskesmas Tigapanah • Puskesmas Merek.",
  manifest: "/manifest.webmanifest",
  applicationName: "Kantong Internship",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kantong Internship",
  },
  // Modern replacement for the deprecated apple-mobile-web-app-capable meta.
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${fontHeading.variable} ${fontBody.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
