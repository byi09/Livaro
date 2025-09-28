import PreferenceToggle from "@/src/components/settings/notifications/PreferenceToggle";
import { NotificationSettingProvider } from "@/src/contexts/NotificationSettingContext";
import Link from "next/link";
import { HiChevronLeft } from "react-icons/hi";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col items-center py-16 gap-8 w-[400px] md:w-[500px] lg:w-[700px] xl:w-[900px] mx-auto">
      <Link
        href="/settings"
        className="text-blue-700 hover:text-blue-500 flex items-center gap-2 mr-auto"
      >
        <HiChevronLeft />
        Back to Settings
      </Link>
      <h1 className="text-3xl font-bold">Notifications</h1>
      <p className="text-center text-gray-600 w-full md:w-4/6">
        Manage how you receive updates about your housing search.
      </p>
      <NotificationSettingProvider>
        <div className="p-8 flex flex-col gap-16 rounded-lg border shadow-md w-full md:max-w-[500px]">
          <section className="space-y-4">
            <h3 className="text-xl font-semibold">
              Updates to saved properties
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Email</span>
                <PreferenceToggle preference="updatesSavedPropertiesEmail" />
              </div>
              <div className="flex items-center justify-between">
                <span>Phone</span>
                <PreferenceToggle preference="updatesSavedPropertiesPush" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">
              New properties that match your preferences
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Email</span>
                <PreferenceToggle preference="newPropertiesEmail" />
              </div>
              <div className="flex items-center justify-between">
                <span>Phone</span>
                <PreferenceToggle preference="newPropertiesPush" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">Property Subletting Alerts</h3>
            <p className="text-sm text-gray-600">
              Get notified when someone lists your property for subletting
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Email</span>
                <PreferenceToggle preference="sublettingNotificationsEmail" />
              </div>
              <div className="flex items-center justify-between">
                <span>Phone</span>
                <PreferenceToggle preference="sublettingNotificationsPush" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">News from Livaro</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Email</span>
                <PreferenceToggle preference="newsEmail" />
              </div>
              <div className="flex items-center justify-between">
                <span>Phone</span>
                <PreferenceToggle preference="newsPush" />
              </div>
            </div>
          </section>
        </div>
      </NotificationSettingProvider>
    </div>
  );
}
