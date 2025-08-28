import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/src/db'
import { users, customers } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

const ONBOARDING_COOKIE_NAME = 'onboarding-status'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const next = searchParams.get('next') ?? '/'
  const returnTo = searchParams.get('returnTo')

  console.log('Auth callback received:', { token_hash, type, code, error, next })

  // Handle OAuth errors first
  if (error) {
    console.error('OAuth Error:', error, searchParams.get('error_description'))
    return NextResponse.redirect(`${origin}/error?type=oauth_error&message=${encodeURIComponent('Authentication was cancelled or failed.')}`)
  }

  const supabase = await createClient()

  // Handle OAuth callback (Google, etc.)
  if (code) {
    console.log('Processing OAuth code:', code)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('OAuth exchange error:', error)
      return NextResponse.redirect(`${origin}/error?type=oauth_error&message=${encodeURIComponent(error.message)}`)
    }
    
    if (data.session) {
      console.log('OAuth success, checking onboarding status')

      // Determine if the logged-in user has completed onboarding so we can set the cookie
      let onboarded = false
      try {
        const userId = data.session.user.id

        const [userRow, customerRow] = await Promise.all([
          db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { id: true },
          }),
          db.query.customers.findFirst({
            where: eq(customers.userId, userId),
            columns: { id: true },
          }),
        ])

        onboarded = !!userRow && !!customerRow
      } catch (err) {
        console.error('Error checking onboarding status during callback:', err)
      }

      const redirectUrl = returnTo || '/home'
      const response = NextResponse.redirect(`${origin}${redirectUrl}`)
      // Set onboarding cookie so the homepage can render correctly the first time.
      response.cookies.set(ONBOARDING_COOKIE_NAME, onboarded.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      })

      return response
    }
  }

  // Handle email confirmation
  if (token_hash && type) {
    console.log('Processing email confirmation:', { token_hash, type })
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      console.log('Email confirmation success, redirecting to sign-in')
      return NextResponse.redirect(`${origin}/sign-in?verified=true`)
    } else {
      console.error('Email confirmation error:', error)
      return NextResponse.redirect(`${origin}/error?type=email_verification_failed&message=${encodeURIComponent('Email verification failed. Please try again.')}`)
    }
  }

  console.log('No valid auth data, redirecting to error')
  return NextResponse.redirect(`${origin}/error?type=invalid_request&message=${encodeURIComponent('Invalid authentication request.')}`)
}