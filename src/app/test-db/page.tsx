'use client'

import { useState, useEffect } from 'react'

export default function TestDB() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    testDatabase()
  }, [])

  const testDatabase = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/test-db-connection')
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Testing database connection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full ${testResult?.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="ml-3 font-medium">
                {testResult?.success ? 'Database Connected' : 'Database Connection Failed'}
              </span>
            </div>
            
            <p className="text-gray-600">{testResult?.message}</p>
            
            {testResult?.success && (
              <div className="mt-4 p-4 bg-green-50 rounded">
                <h3 className="font-semibold text-green-800 mb-2">✅ Success Details:</h3>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• Student Profiles Table: {testResult.studentProfilesTableExists ? 'Exists' : 'Missing'}</li>
                  <li>• Student Profiles Count: {testResult.studentProfilesCount}</li>
                  <li>• Customers Count: {testResult.customersCount}</li>
                </ul>
              </div>
            )}
            
            {!testResult?.success && testResult?.error && (
              <div className="mt-4 p-4 bg-red-50 rounded">
                <h3 className="font-semibold text-red-800 mb-2">❌ Error Details:</h3>
                <p className="text-sm text-red-700">{testResult.error}</p>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <button
              onClick={testDatabase}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Test Again
            </button>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Steps:</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• ✅ Database migration completed</li>
              <li>• ✅ Student profiles table created</li>
              <li>• ✅ API endpoints created</li>
              <li>• ✅ Student dashboard updated</li>
              <li>• 🔄 Test the student dashboard at: <code className="bg-gray-100 px-2 py-1 rounded">/student-dashboard</code></li>
              <li>• 🔄 Test the full integration at: <code className="bg-gray-100 px-2 py-1 rounded">/test-student-dashboard</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 