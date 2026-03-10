import type { Metadata } from "next";
import { Providers } from "./providers";
import { Sidebar } from "@/components/Sidebar";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Intelligent Water Monitoring",
  description: "Real-time water quality monitoring and management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
