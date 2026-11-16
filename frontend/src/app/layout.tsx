import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xander — your AI workspace",
  description: "A thoughtful space to work through ideas with Xander.",
  openGraph: {
    title: "Xander — your AI workspace",
    description: "Chat with your AI assistant.",
    type: "website",
  },
  other: {
    "page-type": "software",
    "site-kind": "software",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-type="software" data-radius="soft" data-buttons="tonal" data-motion="quiet" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
