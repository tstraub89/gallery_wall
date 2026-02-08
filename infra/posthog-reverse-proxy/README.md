# PostHog Reverse Proxy (Cloudflare Worker)

This Cloudflare Worker acts as a reverse proxy for PostHog analytics, allowing traffic to bypass ad blockers and browser privacy features that target third-party tracking domains.

## How It Works

1.  **Incoming Request**: The application sends analytics data to `https://ph.gallery-planner.com`.
2.  **Worker Interception**: This Worker receives the request.
3.  **Forwarding**: The Worker forwards the request to PostHog's ingestion API (`us.i.posthog.com`) or assets CDN (`us-assets.i.posthog.com`).
4.  **Response**: The response is returned to the browser as if it came from your own domain.

## Configuration

The configuration is managed in `wrangler.jsonc`:

```jsonc
{
  "name": "posthog-reverse-proxy",
  "main": "src/index.js",
  "compatibility_date": "2026-02-05",
  "routes": [
    {
      "pattern": "ph.gallery-planner.com",
      "custom_domain": true
    }
  ]
}
```

## Deployment

Navigate to the directory and deploy:

```bash
cd infra/posthog-reverse-proxy
npx wrangler deploy
```

## Maintenance & FAQ

### Do I need to re-deploy this often?
**No.** Once deployed, this worker will run indefinitely without any manual intervention. You only need to re-deploy if:
1.  **PostHog changes their API endpoints**: Very rare, but possible.
2.  **You change your domain**: If you move away from `gallery-planner.com` or want a different subdomain.
3.  **Code Updates**: If you want to modify the proxy logic (e.g., add caching or filtering).

This "set it and forget it" infrastructure is one of the main benefits of Cloudflare Workers.

### Troubleshooting
If analytics stop appearing in PostHog:
1.  Check the `VITE_PUBLIC_POSTHOG_HOST` environment variable in Vercel.
2.  Verify the `ph.gallery-planner.com` DNS record in Cloudflare.
3.  Check the Worker logs in the Cloudflare Dashboard.
