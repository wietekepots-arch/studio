import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import { AppUserProvider } from "@/components/app/AppUserProvider";
import common from "@/content/common.json";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body min-h-screen">
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
