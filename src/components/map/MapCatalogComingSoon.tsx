export default function MapCatalogComingSoon() {
  return (
    <div className="flex flex-col px-6 py-4 gap-4 shadow-xl z-10 h-full min-h-0 overflow-hidden relative">
      <header>
        <h1 className="text-2xl font-bold text-blue-900">Rental Listings</h1>
        <div className="flex justify-between items-center">
          <div className="w-[200px] h-[20px] bg-gray-200 rounded-full"></div>
        </div>
      </header>

      {/* listings */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 relative">
        <div className="h-[360px] rounded-md shadow-md w-full bg-gray-200 border border-gray-200"></div>
        <div className="h-[360px] rounded-md shadow-md w-full bg-gray-200 border border-gray-200"></div>
        <div className="h-[360px] rounded-md shadow-md w-full bg-gray-200 border border-gray-200"></div>
        <div className="h-[360px] rounded-md shadow-md w-full bg-gray-200 border border-gray-200"></div>

        <div className="absolute px-16 py-10 top-60 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Coming Soon!
          </h2>
          <p className="text-gray-600">
            We&apos;re aggregating all the property listings. Stay tuned for
            updates!
          </p>
        </div>
      </div>
    </div>
  );
}
