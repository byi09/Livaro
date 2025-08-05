'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

import PropertyCard from '@/src/components/MapCatalogItem'
import PropertyDetailModal from '@/src/components/map/PropertyDetailModal'
import { HiHeart, HiDocumentText, HiUser, HiSparkles, HiX, HiPencil, HiAcademicCap, HiHome, HiCurrencyDollar } from 'react-icons/hi'
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
  const [activeTab, setActiveTab] = useState<'profile' | 'liked' | 'applications'>('profile')

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

      // Fetch applications (using mock data for now)
      const mockApplications: RentalApplication[] = [
        {
          id: '1',
          propertyId: 'prop-1',
          property: {
            addressLine1: '123 University Ave',
            city: 'Berkeley',
            state: 'CA',
            bedrooms: 2,
            bathrooms: 1
          },
          listing: {
            listingTitle: 'Cozy 2BR near UC Berkeley',
            monthlyRent: 2800
          },
          applicationStatus: 'pending',
          appliedAt: '2024-01-15T10:30:00Z',
          proposedMoveInDate: '2024-08-01',
          proposedRent: 2800,
          coverLetter: 'I am a responsible student looking for a quiet place to study...'
        },
        {
          id: '2',
          propertyId: 'prop-2',
          property: {
            addressLine1: '456 College Blvd',
            city: 'Berkeley',
            state: 'CA',
            bedrooms: 1,
            bathrooms: 1
          },
          listing: {
            listingTitle: 'Studio Apartment - Perfect for Students',
            monthlyRent: 2200
          },
          applicationStatus: 'approved',
          appliedAt: '2024-01-10T14:20:00Z',
          proposedMoveInDate: '2024-07-15',
          proposedRent: 2200,
          coverLetter: 'I am a graduate student with excellent rental history...'
        },
        {
          id: '3',
          propertyId: 'prop-3',
          property: {
            addressLine1: '789 Student St',
            city: 'Berkeley',
            state: 'CA',
            bedrooms: 3,
            bathrooms: 2
          },
          listing: {
            listingTitle: 'Spacious 3BR House - Great for Roommates',
            monthlyRent: 4200
          },
          applicationStatus: 'rejected',
          appliedAt: '2024-01-05T09:15:00Z',
          proposedMoveInDate: '2024-08-01',
          proposedRent: 4200,
          coverLetter: 'We are three students looking for a house to share...'
        }
      ]
      setApplications(mockApplications)

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

  // Don't show separate loading state - let GlobalLoaderOverlay handle it
  if (isLoading) {
    return <div className="min-h-screen bg-gray-50" />;
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
                      ⚡ Complete Your Student Profile
                    </h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <p>
                        Set up your profile to get personalized property recommendations and faster application processing.
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
                    Set Up Profile
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
                Manage your profile, liked properties and rental applications
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
                      Profile Status
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
              onClick={() => setActiveTab('profile')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <HiUser className="w-4 h-4 mr-2" />
              Profile
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
        {activeTab === 'profile' ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Student Profile
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Your saved preferences and information
                  </p>
                </div>
                <button
                  onClick={() => setShowProfileSetup(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <HiPencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              </div>
            </div>

            {!studentProfile ? (
              <div className="text-center py-12">
                <HiUser className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No profile set up</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Set up your student profile to get personalized recommendations.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowProfileSetup(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <HiUser className="w-4 h-4 mr-2" />
                    Set Up Profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <HiUser className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Personal Information</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Full Name</label>
                        <p className="mt-1 text-sm text-gray-900">{studentProfile.firstName} {studentProfile.lastName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{studentProfile.email}</p>
                      </div>
                      {studentProfile.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Phone</label>
                          <p className="mt-1 text-sm text-gray-900">{studentProfile.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <HiAcademicCap className="w-5 h-5 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Academic Information</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">University</label>
                        <p className="mt-1 text-sm text-gray-900">{studentProfile.university}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Major</label>
                        <p className="mt-1 text-sm text-gray-900">{studentProfile.major}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Expected Graduation</label>
                        <p className="mt-1 text-sm text-gray-900">{studentProfile.graduationYear}</p>
                      </div>
                    </div>
                  </div>

                  {/* Housing Preferences */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <HiCurrencyDollar className="w-5 h-5 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Housing Preferences</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Budget Range</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatCurrency(studentProfile.budget.min)} - {formatCurrency(studentProfile.budget.max)}/month
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Preferred Lease Length</label>
                        <p className="mt-1 text-sm text-gray-900">{studentProfile.leaseLength}</p>
                      </div>
                      {studentProfile.moveInDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Preferred Move-in Date</label>
                          <p className="mt-1 text-sm text-gray-900">{formatDate(studentProfile.moveInDate)}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Preferred Areas</label>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {studentProfile.preferredAreas.map((area, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Preferences */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <HiHome className="w-5 h-5 text-orange-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Additional Preferences</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${studentProfile.pets ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="ml-3 text-sm text-gray-900">I have pets</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${studentProfile.parking ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="ml-3 text-sm text-gray-900">I need parking</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${studentProfile.roommates ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="ml-3 text-sm text-gray-900">I'm open to roommates</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${studentProfile.furnished ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="ml-3 text-sm text-gray-900">I prefer furnished</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${studentProfile.utilitiesIncluded ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="ml-3 text-sm text-gray-900">I prefer utilities included</span>
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
                  Properties you've saved for later
                </p>
              </div>
            </div>

            {likedProperties.length === 0 ? (
              <div className="text-center py-12">
                <HiHeart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No liked properties</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start browsing properties and like the ones you're interested in.
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