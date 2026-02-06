import { track } from '@vercel/analytics';

/**
 * Utility for tracking events.
 * 1. Uses Vercel Analytics for formal event tracking.
 * 2. Uses URL hashes for Cloudflare Web Analytics (virtual page views).
 */
export const trackEvent = (eventName: string, properties?: any) => {
    // 1. Vercel Track (Formal Custom Event)
    try {
        track(eventName, properties);
    } catch (e) {
        console.error("Vercel track failed", e);
    }

    // 2. Cloudflare Hash (Virtual Page View)
    // We use a prefix to avoid collision with any potential actual anchor links
    const hash = `event=${eventName}`;
    
    // Update the hash to trigger the analytics beacon
    window.location.hash = hash;
    
    // Optional: Clear the hash after a short delay to keep the URL clean
    setTimeout(() => {
        if (window.location.hash === `#${hash}`) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }, 500);
};

export const PRO_EVENTS = {
    OPEN_PRO_MODAL: 'pro_modal_open',
    PDF_EXPORT: 'export_pdf_guide',
    ZIP_EXPORT: 'export_zip_photos',
    GWALL_EXPORT: 'export_gwall_project',
    PNG_EXPORT: 'export_png_snapshot',
    SMART_LAYOUT: 'smart_layout_generate',
    STAIRCASE_MODE: 'staircase_mode_enable',
};

export const APP_EVENTS = {
    IMPORT_IMAGE: 'image_import',
    ADD_FRAME: 'frame_add',
    SAVE_PROJECT: 'project_save_local',
    LOAD_PROJECT: 'project_load_local',
};

export const LANDING_EVENTS = {
    HERO_CTA: 'landing_hero_cta_click',
    NAV_LAUNCH: 'landing_nav_launch_click',
    PRO_SECTION_CTA: 'landing_pro_cta_click',
    VIEW_FEATURES: 'landing_view_features',
    VIEW_PRO: 'landing_view_pro_section',
};
