'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { HiCloudUpload, HiDocument, HiEye, HiTrash } from 'react-icons/hi'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SubleaseDocument {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  status: 'active' | 'pending' | 'expired'
  propertyAddress?: string
  leaseEndDate?: string
  monthlyRent?: number
}

export default function SublistDashboard() {
  const router = useRouter()
  const [subleases, setSubleases] = useState<SubleaseDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSubleases()
  }, [])

  const fetchSubleases = async () => {
    try {
      setIsLoading(true)
      // TODO: Replace with actual API call to fetch user's subleases
      // For now, using mock data
      setTimeout(() => {
        setSubleases([
          {
            id: '1',
            fileName: 'Apartment_Sublease_Agreement.pdf',
            fileSize: 2485760, // 2.4MB
            uploadedAt: '2024-01-15T10:30:00Z',
            status: 'active',
            propertyAddress: '123 College Ave, University City',
            leaseEndDate: '2024-08-31',
            monthlyRent: 1200
          },
          {
            id: '2',
            fileName: 'Summer_Sublet_Contract.pdf',
            fileSize: 1847520, // 1.8MB
            uploadedAt: '2024-01-10T14:20:00Z',
            status: 'pending',
            propertyAddress: '456 Student Dr, Campus Town',
            leaseEndDate: '2024-07-31',
            monthlyRent: 950
          }
        ])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching subleases:', error)
      setIsLoading(false)
    }
  }



  const deleteSublease = async (id: string) => {
    try {
      // TODO: Implement actual deletion API call
      setSubleases(prev => prev.filter(sublease => sublease.id !== id))
      toast.success('Sublease deleted successfully')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete sublease')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
      expired: { color: 'bg-red-100 text-red-800', text: 'Expired' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 mt-16">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sublease Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your sublease agreements and connect with potential subletters
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Ready to sublet your space?
                  </h3>
                  <p className="text-blue-700">
                    Create a new sublease listing to connect with qualified students.
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/sell/start?mode=sublet')}
                  className="bg-blue-600 hover:bg-blue-700 text-white ml-4"
                >
                  <HiCloudUpload className="w-4 h-4 mr-2" />
                  Create New Listing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subleases List */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Subleases</h2>
            <span className="text-sm text-gray-500">
              {subleases.length} sublease{subleases.length !== 1 ? 's' : ''}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : subleases.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiDocument className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subleases yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload your first sublease agreement to get started
                </p>
                <Button 
                  onClick={() => router.push('/sell/start?mode=sublet')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <HiCloudUpload className="w-4 h-4 mr-2" />
                  Create Sublease Listing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subleases.map((sublease) => (
                <Card key={sublease.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    {/* Status and Actions */}
                    <div className="flex justify-between items-start mb-4">
                      {getStatusBadge(sublease.status)}
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          title="View sublease"
                        >
                          <HiEye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteSublease(sublease.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                          title="Delete sublease"
                        >
                          <HiTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <HiDocument className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {sublease.fileName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(sublease.fileSize)} • Uploaded {formatDate(sublease.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Property Details */}
                    {sublease.propertyAddress && (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Property:</span>
                          <p className="text-gray-900">{sublease.propertyAddress}</p>
                        </div>
                        {sublease.monthlyRent && (
                          <div>
                            <span className="text-gray-500">Rent:</span>
                            <span className="text-gray-900 font-medium"> ${sublease.monthlyRent}/month</span>
                          </div>
                        )}
                        {sublease.leaseEndDate && (
                          <div>
                            <span className="text-gray-500">Lease ends:</span>
                            <span className="text-gray-900"> {formatDate(sublease.leaseEndDate)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <HiDocument className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  How Subletting Works
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Upload your sublease agreement (PDF format)</li>
                  <li>• We'll review and verify the document</li>
                  <li>• Your listing will be shown to qualified students</li>
                  <li>• Connect directly with interested subletters</li>
                  <li>• Complete the transfer process securely</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
