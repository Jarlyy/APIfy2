import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Убираем проверку аутентификации - разрешаем доступ ко всем страницам
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
