import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const DESCRIPTION =
  "Staff shift scheduling for the Hayden Lake Country Club pro shop.";

export const metadata: Metadata = {
  metadataBase: new URL("https://proshop-scheduler.vercel.app"),
  title: "Pro Shop Scheduler",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Pro Shop Scheduler",
    title: "Pro Shop Scheduler",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pro Shop Scheduler",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
