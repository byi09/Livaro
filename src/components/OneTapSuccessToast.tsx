'use client'
import { useState, useEffect } from 'react'
import { HiCheck, HiX } from 'react-icons/hi'

interface OneTapSuccessToastProps {
  isVisible: boolean
  onClose: () => void
}

export default function OneTapSuccessToast({ isVisible, onClose }: OneTapSuccessToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000) // Auto close after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <HiCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-green-800">
              One Tap Application Preferences Saved!
            </h3>
            <p className="mt-1 text-sm text-green-700">
              Your preferences have been successfully saved. Potential tenants can now apply with one tap.
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="text-green-400 hover:text-green-600 transition-colors"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 