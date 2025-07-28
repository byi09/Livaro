import { HiCloudUpload, HiCurrencyDollar, HiPhotograph, HiUserGroup, HiSparkles } from 'react-icons/hi';
import Link from 'next/link';

export default function SellPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              List Your Property
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Get your property in front of thousands of qualified renters
            </p>
            {/* CTA button moved here */}
            <div className="mt-10">
              <Link
                href="/sell/dashboard"
                className="inline-flex justify-center py-3 px-8 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors duration-200"
              >
                List My Property
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Listing Steps */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              List Your Property in 4 Easy Steps
            </h2>
            <p className="text-xl text-gray-600">
              Our streamlined process makes it simple to get your property listed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiCloudUpload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Create Listing</h3>
              <p className="text-gray-600 text-center">Enter your property details and location</p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiPhotograph className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Add Photos</h3>
              <p className="text-gray-600 text-center">Upload high-quality photos of your property</p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiCurrencyDollar className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Set Price</h3>
              <p className="text-gray-600 text-center">Set your rental price and terms</p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiUserGroup className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Get Tenants</h3>
              <p className="text-gray-600 text-center">Start receiving inquiries from qualified renters</p>
            </div>
          </div>
        </div>
      </section>

      {/* One Tap Application Feature Section */}
      <section className="py-16 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
              <HiSparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              One Tap Applications
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Streamline your rental process with instant applications. Configure which fields to include in your application form and let qualified tenants apply with just one tap.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold text-lg">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configure Form Fields</h3>
              <p className="text-gray-600">Choose which fields to include in your application form - from contact info to lease preferences.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold text-lg">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Applications</h3>
              <p className="text-gray-600">Qualified tenants can apply instantly with only the fields you've configured.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold text-lg">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Faster Rentals</h3>
              <p className="text-gray-600">Reduce application time and get qualified tenants into your properties faster.</p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/sell/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
            >
              <HiSparkles className="mr-2 h-5 w-5" />
              Configure Application Form
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}