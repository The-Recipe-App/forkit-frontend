export async function proxyTo(request, targetUrl) {
  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Proto', 'https');
  headers.set('X-Forwarded-Port', '443');
  headers.set('X-Real-IP', request.headers.get('CF-Connecting-IP') ?? '');
  // Don't leak the CF headers to your backend
  headers.delete('CF-Connecting-IP');

  return fetch(new Request(targetUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
  }));
}