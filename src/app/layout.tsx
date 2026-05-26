import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { AppUserProvider } from "@/components/app/AppUserProvider";
import common from "@/content/common.json";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: common.meta.title,
  description: common.meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen font-body`}>
        <FirebaseClientProvider>
          <AppUserProvider>
            {children}
            <Toaster />
          </AppUserProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
