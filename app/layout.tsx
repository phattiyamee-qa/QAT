import type { Metadata } from "next";
import { AppShell } from "@/app/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "PMO Task Tracker",
  description: "QAT Program — PMO Task Tracker",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
