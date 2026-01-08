import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EasySongs",
  description: "Spotify features you wish they had",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
