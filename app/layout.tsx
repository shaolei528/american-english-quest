import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "American English Quest · Pixel Coach",
  description:
    "A pixel-style FSI speaking simulator with American voice lock, three-second reaction drills, make-up day progress, instant correction, and contextual coaching.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
