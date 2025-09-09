<<<<<<< HEAD
import React from 'react';

export default function SublistPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Sublist</h1>
        <p className="text-gray-600 mb-6">Coming soon - Sublet your space or find short-term rentals.</p>
        <div className="text-sm text-gray-500">
          This feature is currently under development.
        </div>
      </div>
    </div>
  );
}
=======
import { HiCloudUpload, HiDocumentText, HiUserGroup, HiSparkles, HiClock } from 'react-icons/hi';
import Link from 'next/link';

export default function SublistPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Sublet Your Space
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Easily sublet your apartment or room to qualified students
            </p>
            {/* CTA button moved here */}
            <div className="mt-10">
              <Link
                href="/sublist/dashboard"
                className="inline-flex justify-center py-3 px-8 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors duration-200"
              >
                Manage My Subleases
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Subletting Steps */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sublet Your Space in 3 Easy Steps
            </h2>
            <p className="text-xl text-gray-600">
              Our streamlined process makes it simple to find the perfect subletter
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiCloudUpload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Upload Sublease</h3>
              <p className="text-gray-600 text-center">Upload your sublease agreement and property details</p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiUserGroup className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Find Subletters</h3>
              <p className="text-gray-600 text-center">Connect with verified students looking for housing</p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiDocumentText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Complete Transfer</h3>
              <p className="text-gray-600 text-center">Finalize the agreement and transfer your lease</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Livaro for Subletting?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiSparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verified Students</h3>
              <p className="text-gray-600">
                All potential subletters are verified students with complete profiles
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiClock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Process</h3>
              <p className="text-gray-600">
                Find subletters quickly with our streamlined matching system
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiDocumentText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Transfers</h3>
              <p className="text-gray-600">
                Safe and secure lease transfer process with legal documentation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-50 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Sublet Your Space?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of students who have successfully sublet their spaces through Livaro
          </p>
          <Link
            href="/sublist/dashboard"
            className="inline-flex justify-center py-3 px-8 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </main>
  );
}
>>>>>>> 847a12b3d149d32a48f262d349c3db334fd47895
