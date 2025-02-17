import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of paths that don't require authentication
const publicPaths = ['/sign-in', '/sign-up', '/forgot-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicPath = publicPaths.includes(pathname)
  const token = request.cookies.get('auth-token')?.value
  
  console.log('Middleware executing for path:', pathname)
  console.log('Is public path:', isPublicPath)
  console.log('Auth token:', token)

  // If trying to access public paths while authenticated
  if (isPublicPath && token) {
    console.log('Authenticated user trying to access public path, redirecting to home')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If trying to access protected paths without authentication
  if (!isPublicPath && !token && pathname !== '/') {
    console.log('Unauthenticated user trying to access protected path, redirecting to sign-in')
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // If trying to access root path without authentication
  if (pathname === '/' && !token) {
    console.log('Unauthenticated user trying to access root, redirecting to sign-in')
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  console.log('Access granted')
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Apply middleware to all routes except static files and api
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 