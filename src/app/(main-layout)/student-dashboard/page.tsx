'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { LoadingOverlay } from '@/src/components/ui/Spinner'
import PropertyCard from '@/src/components/MapCatalogItem'
import PropertyDetailModal from '@/src/components/map/PropertyDetailModal'
import { HiHeart, HiDocumentText, HiUser, HiSparkles, HiX, HiPencil, HiAcademicCap, HiHome, HiCurrencyDollar } from 'react-icons/hi'
import { HiMapPin } from 'react-icons/hi2'
import type { PropertyListing } from '@/lib/types'
import StudentProfileForm from '@/src/components/StudentProfileForm'

interface RentalApplication {
  id: string
  propertyId: string
  property: {
    addressLine1: string
    city: string
    state: string
    bedrooms: number
    bathrooms: number
  }
  listing: {
    listingTitle: string
    monthlyRent: number
  }
  applicationStatus: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  appliedAt: string
  proposedMoveInDate?: string
  proposedRent?: number
  coverLetter?: string
}

interface StudentProfile {
  firstName: string
  lastName: string
  email: string
  phone?: string
  university: string
  graduationYear: string
  major: string
  budget: {
    min: number
    max: number
  }
  preferredAreas: string[]
  moveInDate: string
  leaseLength: string
  pets: boolean
  parking: boolean
  roommates: boolean
  furnished: boolean
  utilitiesIncluded: boolean
}

export default function StudentDashboard() {
  const router = useRouter()
  const [likedProperties, setLikedProperties] = useState<PropertyListing[]>([])
  const [applications, setApplications] = useState<RentalApplication[]>([])
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [activeTab, setActiveTab] = useState<'preferences' | 'liked' | 'applications'>('preferences')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Please sign in to view your dashboard')
        setIsLoading(false)
        return
      }

      // Fetch liked properties
      const likedResponse = await fetch('/api/properties/like')
      if (likedResponse.ok) {
        const likedData = await likedResponse.json()
        setLikedProperties(likedData.properties || [])
      }

      // Fetch applications from API
      const applicationsResponse = await fetch('/api/applications')
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json()
        if (applicationsData.applications && applicationsData.applications.length > 0) {
          const transformedApplications: RentalApplication[] = applicationsData.applications.map((app: Record<string, unknown>) => ({
            id: app.id,
            propertyId: app.propertyId,
            property: {
              addressLine1: app.propertyAddressLine1 || '',
              city: app.propertyCity || '',
              state: app.propertyState || '',
              bedrooms: app.propertyBedrooms || 0,
              bathrooms: app.propertyBathrooms || 0
            },
            listing: {
              listingTitle: app.listingTitle || 'Property Listing',
              monthlyRent: Number(app.monthlyRent) || 0
            },
            applicationStatus: app.applicationStatus || 'pending',
            appliedAt: app.appliedAt || new Date().toISOString(),
            proposedMoveInDate: app.proposedMoveInDate || '',
            proposedRent: Number(app.proposedRent) || 0,
            coverLetter: app.coverLetter || ''
          }))
          setApplications(transformedApplications)
        } else {
          setApplications([])
        }
      } else {
        console.error('Failed to fetch applications:', applicationsResponse.status)
        setApplications([])
      }

      // Check if student profile exists
      const profileResponse = await fetch('/api/student/profile')
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setStudentProfile(profileData.profile)
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
      setIsLoading(false)
    }
  }

  const handleUnlike = (propertyId: string) => {
    setLikedProperties(prev => prev.filter(p => p.properties.id !== propertyId))
  }

  const handleContact = (property: PropertyListing, method: 'phone' | 'email' | 'message') => {
    console.log(`User wants to contact via ${method}`, property)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    }

    const statusLabels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800'
      }`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <LoadingOverlay
        show={true}
        message="Loading your dashboard..."
        subtitle="Please wait while we fetch your data"
        size={48}
        opacity="heavy"
      />
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 mt-16">
        {/* Student Profile Setup Banner */}
        {!studentProfile && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <HiSparkles className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">
                      ⚡ Set Up Your Housing Preferences
                    </h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <p>
                        Tell us about your housing needs to get personalized property recommendations.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProfileSetup(true)}
                    className="ml-4 flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <HiX className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => setShowProfileSetup(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <HiUser className="w-4 h-4 mr-2" />
                    Set Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Manage your housing preferences, liked properties and rental applications
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <HiUser className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Preferences Set
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {studentProfile ? 'Complete' : 'Incomplete'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <HiHeart className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Liked Properties
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {likedProperties.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <HiDocumentText className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Applications
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {applications.filter(app => app.applicationStatus === 'approved').length}
                    </span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Approved
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.filter(app => app.applicationStatus === 'approved').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'preferences'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <HiUser className="w-4 h-4 mr-2" />
              Housing Preferences
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'liked'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <HiHeart className="w-4 h-4 mr-2" />
              Liked Properties ({likedProperties.length})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'applications'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <HiDocumentText className="w-4 h-4 mr-2" />
              Applications ({applications.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'preferences' ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Your Housing Preferences
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Your saved housing requirements and preferences
                  </p>
                </div>
                <button
                  onClick={() => setShowProfileSetup(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <HiPencil className="w-4 h-4 mr-2" />
                  Edit Preferences
                </button>
              </div>
            </div>

            {!studentProfile ? (
              <div className="text-center py-12">
                <HiUser className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Set Up Your Housing Preferences</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tell us about your university, budget, and housing preferences to get personalized property recommendations.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowProfileSetup(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <HiUser className="w-4 h-4 mr-2" />
                    Set Preferences
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-8">
                  {/* Personal Information */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <HiUser className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">Personal Information</h4>
                        <p className="text-sm text-gray-600">Your basic contact details</p>
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <p className="text-lg font-medium text-gray-900">
                          {studentProfile.firstName && studentProfile.lastName 
                            ? `${studentProfile.firstName} ${studentProfile.lastName}`
                            : <span className="text-gray-400 italic">Not specified</span>
                          }
                        </p>
                      </div>
                      {studentProfile.phone && (
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                          <p className="text-lg font-medium text-gray-900">{studentProfile.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Academic Information */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <HiAcademicCap className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">Academic Information</h4>
                          <p className="text-sm text-gray-600">Your educational background</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-green-100">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">University</label>
                          <p className="text-lg font-medium text-gray-900">
                            {studentProfile.university || <span className="text-gray-400 italic">Not specified</span>}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-100">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Major</label>
                          <p className="text-lg font-medium text-gray-900">
                            {studentProfile.major || <span className="text-gray-400 italic">Not specified</span>}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-100">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Graduation</label>
                          <p className="text-lg font-medium text-gray-900">
                            {studentProfile.graduationYear || <span className="text-gray-400 italic">Not specified</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                </div>

                  {/* Budget & Timeline */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <HiCurrencyDollar className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">Budget & Timeline</h4>
                        <p className="text-sm text-gray-600">Your housing budget and timeline</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Range</label>
                        <p className="text-lg font-medium text-gray-900">
                          {studentProfile.budget.min > 0 && studentProfile.budget.max > 0 
                            ? `${formatCurrency(studentProfile.budget.min)} - ${formatCurrency(studentProfile.budget.max)}/month`
                            : <span className="text-gray-400 italic">Not specified</span>
                          }
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Lease Length</label>
                        <p className="text-lg font-medium text-gray-900">
                          {studentProfile.leaseLength || <span className="text-gray-400 italic">Not specified</span>}
                        </p>
                      </div>
                      {studentProfile.moveInDate ? (
                        <div className="bg-white rounded-lg p-4 border border-purple-100">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Move-in Date</label>
                          <p className="text-lg font-medium text-gray-900">{formatDate(studentProfile.moveInDate)}</p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-4 border border-purple-100">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Move-in Date</label>
                          <p className="text-lg font-medium text-gray-400 italic">Not specified</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location Preferences */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-indigo-100 rounded-xl">
                        <HiMapPin className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">Location Preferences</h4>
                        <p className="text-sm text-gray-600">Your preferred neighborhoods</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-indigo-100">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Preferred Areas</label>
                      <div className="flex flex-wrap gap-2">
                        {studentProfile.preferredAreas && studentProfile.preferredAreas.length > 0 ? (
                          studentProfile.preferredAreas.map((area, index) => (
                            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                              {area}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">Not specified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Requirements */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-orange-100 rounded-xl">
                        <HiHome className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">Additional Requirements</h4>
                        <p className="text-sm text-gray-600">Your housing preferences</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-orange-100">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full ${studentProfile.pets ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm font-medium text-gray-900">I have pets</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-orange-100">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full ${studentProfile.parking ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm font-medium text-gray-900">I need parking</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-orange-100">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full ${studentProfile.roommates ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm font-medium text-gray-900">I&apos;m open to roommates</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-orange-100">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full ${studentProfile.furnished ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm font-medium text-gray-900">I prefer furnished</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-orange-100 md:col-span-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full ${studentProfile.utilitiesIncluded ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm font-medium text-gray-900">I prefer utilities included</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'liked' ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Liked Properties
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Properties you&apos;ve saved for later
                </p>
              </div>
            </div>

            {likedProperties.length === 0 ? (
              <div className="text-center py-12">
                <HiHeart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No liked properties</h3>
                                  <p className="mt-1 text-sm text-gray-500">
                    Start browsing properties and like the ones you&apos;re interested in.
                  </p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/map')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Browse Properties
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {likedProperties.map((item) => {
                  if (!item?.property_listings) return null

                  return (
                    <div
                      key={item.property_listings.id}
                      onClick={() => setSelectedProperty(item)}
                    >
                      <PropertyCard
                        item={item}
                        initialLiked={true}
                        onUnlike={handleUnlike}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Rental Applications
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Track the status of your rental applications
                </p>
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-12">
                <HiDocumentText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start applying to properties to see your applications here.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/map')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Browse Properties
                  </button>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {applications.map((application) => (
                  <li key={application.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {application.property.bedrooms}BR
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {application.listing.listingTitle}
                            </p>
                            <div className="ml-2">
                              {getStatusBadge(application.applicationStatus)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            {application.property.addressLine1}, {application.property.city}, {application.property.state}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${application.listing.monthlyRent}/month • Applied {formatDate(application.appliedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            // View application details
                            console.log('View application:', application)
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Property Detail Modal */}
        {selectedProperty && (
          <PropertyDetailModal
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            onContact={handleContact}
          />
        )}

        {/* Student Profile Setup Form */}
        <StudentProfileForm
          isOpen={showProfileSetup}
          onClose={() => setShowProfileSetup(false)}
          onSuccess={() => {
            setShowProfileSetup(false)
            // In a real app, you'd fetch the updated profile data
            fetchDashboardData()
          }}
        />
      </div>
    </main>
  )
} 