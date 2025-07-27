'use client'
import { useState, useEffect } from 'react'
import { HiSparkles, HiX } from 'react-icons/hi'

interface OneTapApplicationBannerProps {
  onSetupClick: () => void
}

export default function OneTapApplicationBanner({ onSetupClick }: OneTapApplicationBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkPreferences()
  }, [])

  const checkPreferences = async () => {
    try {
      const response = await fetch('/api/one-tap-application-preferences')
      const data = await response.json()
      
      // Show banner if no preferences exist or if there's an error
      setIsVisible(!data.preferences)
    } catch (error) {
      console.error('Error checking preferences:', error)
      // Show banner on error to be safe
      setIsVisible(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !isVisible) {
    return null
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <HiSparkles className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-purple-800">
                🚀 Set Up One Tap Applications
              </h3>
              <div className="mt-1 text-sm text-purple-700">
                <p>
                  Streamline your rental process by setting up your One Tap Application preferences. 
                  This allows potential tenants to apply instantly with pre-filled information.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="ml-4 flex-shrink-0 text-purple-400 hover:text-purple-600 transition-colors"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3">
            <button
              onClick={onSetupClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              <HiSparkles className="w-4 h-4 mr-2" />
              Set Up Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 