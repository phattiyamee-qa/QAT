import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PMO Task Tracker",
  description: "QAT Program — PMO Task Tracker",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
