
import { useCallback } from 'react';
import packageJson from '../../package.json';

export const useBugReporter = () => {
    const reportBug = useCallback(() => {
        const subject = encodeURIComponent(`Bug Report: GalleryPlanner v${packageJson.version}`);

        const debugInfo = [
            `App Version: ${packageJson.version}`,
            `Browser: ${navigator.userAgent}`,
            `Screen: ${window.innerWidth}x${window.innerHeight}`,
            `Platform: ${navigator.platform}`,
            `Referrer: ${document.referrer || 'Direct'}`,
            `Time: ${new Date().toISOString()}`,
        ].join('\n');

        const body = encodeURIComponent(
            `Describe the issue you are facing:\n\n\n\n\n` +
            `----------------------------------------\n` +
            `Debug Info (Please leave this below):\n` +
            `${debugInfo}`
        );

        const mailtoLink = `mailto:support@gallery-planner.com?subject=${subject}&body=${body}`;

        // Open standard mail client
        window.location.href = mailtoLink;
    }, []);

    return { reportBug };
};
