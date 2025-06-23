'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { useToast } from '@/src/components/ui/Toast';
import Spinner, { LoadingOverlay } from '@/src/components/ui/Spinner';
import { Mail, Lock, ArrowLeft } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVerified = searchParams.get('verified') === 'true';
  const { success, error: showError } = useToast();

  // Check if user is already authenticated and onboarded
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        try {
          const res = await fetch('/api/onboarding/check-status');
          if (res.ok) {
            const { onboarded } = await res.json();
            if (onboarded) {
              router.push('/');
              return;
            }
            // Logged in but not onboarded -> go to landing for onboarding flow
            router.push('/');
            return;
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      }
      setChecking(false);
    };

    checkAuth();
  }, [router]);

  // Show success message for email verification
  useEffect(() => {
    if (isVerified) {
      success('Email verified successfully!', 'You can now sign in with your account.');
    }
  }, [isVerified, success]);

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    const supabase = createClient();
    const {error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoading(false);
      showError('Sign in failed', error.message);
    } else {
      success('Welcome back!', 'Redirecting...');
      // Full page reload so that onboarding status and header sync correctly
      window.location.href = '/';
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrors({});
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback`
      }
    });
    
    if (error) {
      setGoogleLoading(false);
      showError('Google sign in failed', error.message);
    }
  };

  if (checking) {
    return (
      <LoadingOverlay
        show={true}
        message="Checking authentication..."
        subtitle="Please wait while we verify your session"
        size={40}
        opacity="heavy"
      />
    );
  }

  const isFormLoading = loading || googleLoading;

  return (
    <div className="flex min-h-screen relative">
      {/* Loading Overlay */}
      <LoadingOverlay
        show={loading}
        message="Signing you in..."
        subtitle="Please wait while we authenticate your account"
        container={false}
        opacity="heavy"
      />

      {/* Back button - positioned at the top left */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 z-10"
        disabled={isFormLoading}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to home
      </Button>

      {/* Left side - Login form */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 lg:p-10 justify-center bg-white">
        <div className="max-w-md mx-auto w-full space-consistent">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative w-10 h-10 mr-2">
              <Image
                src="/logo.png"
                alt="Livaro Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold text-gray-900">Livaro</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="Enter your email"
              disabled={isFormLoading}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              placeholder="Enter your password"
              disabled={isFormLoading}
              required
            />

            <Button
              type="submit"
              loading={loading}
              loadingText="Signing in..."
              className="w-full border border-gray-300"
              size="lg"
            >
              Sign in
            </Button>
          </form>

          <div className="mt-8 space-y-4">
            <p className="text-center text-sm text-gray-600">
              New to Livaro?{' '}
              <Link href="/sign-up" className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200">
                Create account
              </Link>
            </p>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-sm text-gray-500">OR</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isFormLoading}
              loading={googleLoading}
              loadingText="Signing in with Google..."
              className="w-full"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/hero-bg.jpg"
          alt="Apartments hero"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
} 