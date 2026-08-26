import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ['/:lang(ro|en|fa)/app/:path*', '/:lang(ro|en|fa)/login'],
};
