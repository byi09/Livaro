'use client';
import { useRouter } from 'next/navigation';

export default function PropertyCreatedSuccess() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Created Successfully!</h1>
          <p className="text-gray-600">
            Your property has been added to our platform. You can now manage it from your dashboard.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/sell/dashboard')}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/sell/start')}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Add Another Property
          </button>
        </div>
      </div>
    </main>
  );
} 