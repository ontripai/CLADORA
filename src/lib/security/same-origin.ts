export function hasTrustedMutationOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? requestUrl.protocol.replace(':', '');
  const expectedOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : requestUrl.origin;
  return origin === expectedOrigin;
}
