'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function TestStudentDashboard() {
  const [testData, setTestData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    testBackendIntegration()
  }, [])

  const testBackendIntegration = async () => {
    try {
      setLoading(true)
      setError(null)

      // Test student profile API
      const profileResponse = await fetch('/api/student/profile')
      const profileData = await profileResponse.json()

      // Test applications API
      const applicationsResponse = await fetch('/api/applications')
      const applicationsData = await applicationsResponse.json()

      // Test general data API
      const testDataResponse = await fetch('/api/test-student-data')
      const testData = await testDataResponse.json()

      setTestData({
        profile: profileData,
        applications: applicationsData,
        testData: testData
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Testing backend integration...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={testBackendIntegration}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Dashboard Backend Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Profile API</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Status:</strong> {testData.profile.message}</p>
              <p><strong>Profile exists:</strong> {testData.profile.profile ? 'Yes' : 'No'}</p>
              {testData.profile.profile && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <p><strong>Name:</strong> {testData.profile.profile.firstName} {testData.profile.profile.lastName}</p>
                  <p><strong>Email:</strong> {testData.profile.profile.email}</p>
                  <p><strong>University:</strong> {testData.profile.profile.university || 'Not set'}</p>
                  <p><strong>Major:</strong> {testData.profile.profile.major || 'Not set'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Applications Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Applications API</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Applications count:</strong> {testData.applications.applications?.length || 0}</p>
              {testData.applications.applications && testData.applications.applications.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <p><strong>First application:</strong></p>
                  <p>Status: {testData.applications.applications[0].applicationStatus}</p>
                  <p>Property: {testData.applications.applications[0].propertyAddressLine1}</p>
                </div>
              )}
            </div>
          </div>

          {/* Database Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Test</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Message:</strong> {testData.testData.message}</p>
              <p><strong>Customers:</strong> {testData.testData.data.customers}</p>
              <p><strong>Student Profiles:</strong> {testData.testData.data.studentProfiles}</p>
              <p><strong>Applications:</strong> {testData.testData.data.applications}</p>
              <p><strong>Properties:</strong> {testData.testData.data.properties}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={testBackendIntegration}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh Test Data
          </button>
        </div>
      </div>
    </div>
  )
} 