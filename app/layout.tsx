import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clean X Timeline",
  description: "A focused viewer for public X posts from one username."
};

export default function RootLayout({
  children
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
