/**
 * Utility for tracking events via URL hashes.
 * This allows Cloudflare Web Analytics (and other SPA-compatible trackers)
 * to record custom events as virtual page views.
 */
export const trackEvent = (eventName: string) => {
    // We use a prefix to avoid collision with any potential actual anchor links
    const hash = `event=${eventName}`;
    
    // Update the hash to trigger the analytics beacon
    window.location.hash = hash;
    
    // Optional: Clear the hash after a short delay to keep the URL clean
    // and allow the same event to be tracked again if triggered consecutively.
    setTimeout(() => {
        if (window.location.hash === `#${hash}`) {
            // Using history.replaceState to clear the hash without adding to history
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }, 500);
};

export const PRO_EVENTS = {
    OPEN_PRO_MODAL: 'open_pro_modal',
    PDF_EXPORT: 'pdf_export',
    ZIP_EXPORT: 'zip_export',
    GWALL_EXPORT: 'gwall_export',
    PNG_EXPORT: 'png_export',
    SMART_LAYOUT: 'smart_layout_generate',
    STAIRCASE_MODE: 'stairCASE_mode_toggle', // Pro feature
};

export const APP_EVENTS = {
    IMPORT_IMAGE: 'import_image',
    ADD_FRAME: 'add_frame',
    SAVE_PROJECT: 'save_project',
    LOAD_PROJECT: 'load_project',
};
