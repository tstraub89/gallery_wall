export default function middleware(request: Request) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown';

    // 1. Block obvious malicious User-Agents
    // We explicitly ALLOW 'gptbot', 'googlebot', 'bingbot', 'applebot' etc. by omission or explicit check
    const maliciousUAs = [
        'python-requests',
        'curl',
        'wget',
        'go-http-client',
        'libwww-perl',
        'php',
        'postmanruntime',
        'headlesschrome',
        'puppeteer',
        'zgrab',
    ];

    if (maliciousUAs.some(ua => userAgent.includes(ua))) {
        console.warn(`Blocked malicious UA: ${userAgent} from IP: ${ip}`);
        return new Response('Access Denied', { status: 403 });
    }

    // 2. Block suspicious paths (common exploit targets)
    const suspiciousPaths = [
        '/.env',
        '/wp-login.php',
        '/wp-admin',
        '/.git',
        '/cgi-bin',
    ];

    if (suspiciousPaths.some(path => url.pathname.toLowerCase().includes(path))) {
        console.warn(`Blocked suspicious path access: ${url.pathname} from IP: ${ip}`);
        return new Response('Not Found', { status: 404 });
    }

    return new Response(null, {
        headers: { 'x-middleware-next': '1' },
    });
}

export const config = {
    matcher: ['/((?!public|assets|.*\\..*).*)'],
};
