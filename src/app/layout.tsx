import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://covergrail.netlify.app",
);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "CoverGrail — Pre-submission comic estimates",
    template: "%s · CoverGrail",
  },
  description:
    "Upload comic photos for predicted grade ranges, defect cues, and submit-or-sell guidance before you pay grading fees.",
  openGraph: {
    type: "website",
    url: "/",
    title: "CoverGrail — Before you slab it, scan it",
    description:
      "Pre-submission comic grade ranges, visible defect cues, and decision support for collectors.",
    siteName: "CoverGrail",
  },
  twitter: {
    card: "summary_large_image",
    title: "CoverGrail — Before you slab it, scan it",
    description:
      "Pre-submission comic grade ranges, visible defect cues, and decision support for collectors.",
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
      className={`${dmSans.variable} ${cormorant.variable} h-full bg-zinc-950 antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-50">{children}</body>
    </html>
  );
}
