'use client';

import Image from 'next/image';
import Link from 'next/link';
import { signUpNewUser } from '@/utils/supabase/actions';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

// Password validation utility
const validatePassword = (password: string) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };
  
  const isValid = Object.values(requirements).every(req => req);
  
  return { requirements, isValid };
};

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  

  const { requirements, isValid: isPasswordValid } = validatePassword(password);
  const passwordsMatch = password === confirmPassword;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/callback` }
    });
    if (error) {
      setLoading(false);
      setErrorMessage(error.message);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    // Client-side password validation before submission
    if (!isPasswordValid) {
      setErrorMessage('Please ensure your password meets all requirements.');
      return;
    }
    
    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      await signUpNewUser(formData);
    } catch {
      setLoading(false);
      setErrorMessage('An error occurred during sign up. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 relative">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative w-10 h-10 mr-2">
            <Image
              src="/logo.png"
              alt="Livaro Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold text-gray-900">Livaro</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create your account</h1>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        <form action={handleSubmit} className="flex flex-col gap-5" autoComplete="off">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address*</label>
            <input id="email" name="email" type="email" required className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Enter your email" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setShowPasswordRequirements(true)}
              className={`block w-full px-4 py-3 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                password && !isPasswordValid ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Create a password" 
            />
            
            {/* Password Requirements */}
            {showPasswordRequirements && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                <ul className="space-y-1">
                  <li className={`text-xs flex items-center ${requirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className={`mr-2 ${requirements.minLength ? '✓' : '○'}`}></span>
                    At least 8 characters
                  </li>
                  <li className={`text-xs flex items-center ${requirements.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className={`mr-2 ${requirements.hasUppercase ? '✓' : '○'}`}></span>
                    One uppercase letter (A-Z)
                  </li>
                  <li className={`text-xs flex items-center ${requirements.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className={`mr-2 ${requirements.hasLowercase ? '✓' : '○'}`}></span>
                    One lowercase letter (a-z)
                  </li>
                  <li className={`text-xs flex items-center ${requirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className={`mr-2 ${requirements.hasNumber ? '✓' : '○'}`}></span>
                    One number (0-9)
                  </li>
                  <li className={`text-xs flex items-center ${requirements.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className={`mr-2 ${requirements.hasSpecialChar ? '✓' : '○'}`}></span>
                    One special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password*</label>
            <input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`block w-full px-4 py-3 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                confirmPassword && !passwordsMatch ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Confirm your password" 
            />
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
            )}
          </div>
          <div className="relative py-3 mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-sm text-gray-500">OR</span>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
          <button 
            type="submit" 
            disabled={loading || !!(password && !isPasswordValid) || !!(confirmPassword && !passwordsMatch)}
            className={`w-full font-semibold py-3 px-4 rounded mt-2 transition-all duration-200 ${
              loading || !!(password && !isPasswordValid) || !!(confirmPassword && !passwordsMatch)
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Creating Account...' : 'Sign up'}
          </button>
        </form>
        <div className="mt-5 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-blue-600 hover:text-blue-800 font-medium">Sign in</Link>
          </p>
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By submitting, I accept Rentora&apos;s <a href="/terms" className="text-blue-600 hover:text-blue-800">terms of use</a>
          </p>
        </div>
      </div>
    </div>
  );
} 