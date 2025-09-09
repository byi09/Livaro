import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const ONBOARDING_COOKIE_NAME = 'onboarding-status'

export async function middleware(request: NextRequest) {
  // keep the Supabase session in sync
  const response = await updateSession(request)

  // Use the same cookie-based auth strategy as updateSession so that
  // supabase.auth.getUser() correctly identifies the logged-in user.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Forward any cookie updates to the response so they reach the browser
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // unauthenticated users
  if (!user) {
    // Clear onboarding cookie if user is not authenticated
    response.cookies.delete(ONBOARDING_COOKIE_NAME)
    
    const allowed = ['/', '/map', '/sign-in', '/sign-up', '/callback', '/error', '/confirm-email','/student', '/owners']
    if (!allowed.includes(pathname)) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
    return response
  }

  // For authenticated users, check onboarding status using cookie
  const onboardingCookie = request.cookies.get(ONBOARDING_COOKIE_NAME)
  
  if (onboardingCookie) {
    // Use cached value from cookie for speed
    const onboarded = onboardingCookie.value === 'true'
    
    // Redirect logic based on onboarding status
    if (!onboarded) {
      // Non-onboarded users should only access the home page for onboarding
      if (pathname !== '/') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } else {
      // Onboarded users should be redirected away from sign-in pages only
      if (pathname.startsWith('/sign-in')) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }
  // If no cookie exists, let the request proceed and let the page handle the database check

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     * - (auth)/ (route group auth pages)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|\\(auth\\)/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}