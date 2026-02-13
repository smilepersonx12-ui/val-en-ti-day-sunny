export const config = {
  matcher: '/:path*',
};

export default function middleware(request) {
  const country = request.geo?.country;
  
  // Allow access if country is undefined (e.g. localhost) or if it is 'ID' (Indonesia)
  if (country && country !== 'ID') {
    return new Response(`
      <html>
        <head><title>Access Denied</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#050510;color:white;font-family:sans-serif;">
          <div style="text-align:center">
            <h1>⛔ Access Restricted</h1>
            <p>This experience is only available in Indonesia.</p>
          </div>
        </body>
      </html>
    `, {
      status: 403,
      headers: { 'content-type': 'text/html' },
    });
  }
}
