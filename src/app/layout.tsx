import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GeolocationProvider } from "@/src/contexts/GeolocationContext";
import { MapContextProvider } from "@/src/contexts/MapContext";
import { PropertyModalProvider } from "@/src/contexts/MapContext";
import { NotificationSettingProvider } from "@/src/contexts/NotificationSettingContext";
import { AccountSettingProvider } from "@/src/contexts/AccountSettingContext";
import { GlobalLoaderProvider } from "@/src/contexts/GlobalLoaderContext";
import ClientLayout from "@/src/components/ClientLayout";
import PropertyModalHandler from "@/src/components/PropertyModalHandler";
import { Analytics } from "@vercel/analytics/next"
import MessagingHandler from "@/src/components/messaging/MessagingHandler"
import { ToastProvider } from "@/src/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Livaro - Find Your Perfect Rental",
  description: "Discover and rent properties with ease using our interactive map and advanced search features.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Ensure responsive sizing on all devices */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        {/* Preload Inter font for better performance */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
        <noscript>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
        </noscript>
      </head>
      <body className={`${inter.className} text-gray-900 antialiased bg-white`}>
        <ToastProvider>
          <PropertyModalProvider>
            <GeolocationProvider>
              <MapContextProvider>
                <NotificationSettingProvider>
                  <AccountSettingProvider>
                    <GlobalLoaderProvider>
                      <ClientLayout>
                        {children}
                        <PropertyModalHandler />
                        <MessagingHandler />
                      </ClientLayout>
                      <Analytics />
                    </GlobalLoaderProvider>
                  </AccountSettingProvider>
                </NotificationSettingProvider>
              </MapContextProvider>
            </GeolocationProvider>
          </PropertyModalProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
