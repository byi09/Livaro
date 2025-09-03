'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function StartListingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') // Check for sublet mode

  const isSubletMode = mode === 'sublet'
  
  // Get sublease file name from session storage if in sublet mode
  const subleaseFileName = typeof window !== 'undefined' 
    ? sessionStorage.getItem('subleaseFileName') 
    : null

  const handleAutofillChoice = () => {
    // Navigate directly to manage media page
    const targetUrl = isSubletMode 
      ? '/sell/manage-media?mode=sublet'
      : '/sell/manage-media'
    
    router.push(targetUrl)
  }

  const handleManualChoice = () => {
    const targetUrl = isSubletMode 
      ? '/sell/create?mode=sublet'
      : '/sell/create'
    
    router.push(targetUrl)
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Close Button */}
        <div className="flex justify-end mb-8">
          <button 
            onClick={() => router.push('/sell/dashboard')}
            className="w-12 h-12 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center hover:bg-blue-50 transition-colors shadow-sm"
          >
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-12">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {isSubletMode ? 'Start Your Sublease Listing' : 'Start Your Application'}
              </h1>
              
              {isSubletMode && subleaseFileName && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        📄 Sublease Agreement Uploaded
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p><strong>File:</strong> {subleaseFileName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-lg text-gray-600">
                {isSubletMode 
                  ? 'Create your sublease listing in just a few steps'
                  : 'Create your property listing in just a few steps'
                }
              </p>
            </div>

            {/* Autofill Option */}
            <div className="space-y-4 mb-8">
              <div className="border-2 border-blue-600 rounded-lg p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Autofill with Leasing Information
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Upload and manage your property media files to automatically extract details
                  </p>
                  <button
                    onClick={handleAutofillChoice}
                    className="w-full py-4 px-6 bg-white text-blue-600 text-lg font-medium border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Autofill with Leasing Information
                  </button>
                </div>
              </div>
            </div>

            {/* Manual Option */}
            <div className="border-2 border-blue-600 rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Create Manually
                </h3>
                <p className="text-gray-600 mb-6">
                  Fill out the property information step by step
                </p>
                <button
                  onClick={handleManualChoice}
                  className="w-full py-4 px-6 bg-white text-blue-600 text-lg font-medium border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {isSubletMode ? 'Create New Sublease Manually' : 'Apply Manually'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
