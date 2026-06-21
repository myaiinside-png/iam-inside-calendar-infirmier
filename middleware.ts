import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (request.method === 'GET') {
    return NextResponse.next()
  }

  if (pathname === '/api/demandes' && request.method === 'POST') {
    return NextResponse.next()
  }

  const session = request.cookies.get('admin_session')?.value
  const isValid = session === process.env.ADMIN_PASSWORD

  if (!isValid) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/disponibilites/:path*',
    '/api/demandes/:path*',
  ],
}
