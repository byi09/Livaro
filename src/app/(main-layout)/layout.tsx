import type { Metadata } from "next";
import { GeolocationProvider } from "@/src/contexts/GeolocationContext";
import { MapContextProvider } from "@/src/contexts/MapContext";
import { PropertyModalProvider } from "@/src/contexts/MapContext";
import { NotificationSettingProvider } from "@/src/contexts/NotificationSettingContext";
import { AccountSettingProvider } from "@/src/contexts/AccountSettingContext";
import { GlobalLoaderProvider } from "@/src/contexts/GlobalLoaderContext";
import ClientLayout from "@/src/components/ClientLayout";
import PropertyModalHandler from "@/src/components/PropertyModalHandler";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Livaro - Find Your Perfect Rental",
  description: "Discover and rent properties with ease using our interactive map and advanced search features.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PropertyModalProvider>
      <GeolocationProvider>
        <MapContextProvider>
          <NotificationSettingProvider>
            <AccountSettingProvider>
              <GlobalLoaderProvider>
                <ClientLayout>
                  {children}
                  <PropertyModalHandler />
                </ClientLayout>
                <Analytics />
              </GlobalLoaderProvider>
            </AccountSettingProvider>
          </NotificationSettingProvider>
        </MapContextProvider>
      </GeolocationProvider>
    </PropertyModalProvider>
  );
}