import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
) {
    const DEPLOY_HOOK_URL = process.env.VERCEL_DEPLOY_HOOK_URL;

    if (!DEPLOY_HOOK_URL) {
        return response.status(500).json({
            error: 'VERCEL_DEPLOY_HOOK_URL environment variable is not set',
        });
    }

    try {
        const result = await fetch(DEPLOY_HOOK_URL, {
            method: 'POST',
        });

        if (result.ok) {
            return response.status(200).json({
                message: 'Deployment triggered successfully',
            });
        } else {
            const errorText = await result.text();
            return response.status(500).json({
                error: `Failed to trigger deployment: ${errorText}`,
            });
        }
    } catch (error) {
        return response.status(500).json({
            error: `Error triggering deployment: ${error instanceof Error ? error.message : String(error)}`,
        });
    }
}
