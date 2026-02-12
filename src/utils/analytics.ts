import posthog from 'posthog-js';

/**
 * Utility for tracking events.
 * Uses PostHog for all event tracking.
 */
export const trackEvent = (eventName: string, properties?: any) => {
    try {
        posthog.capture(eventName, properties);
    } catch (e) {
        console.error("PostHog capture failed", e);
    }
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

export const FEEDBACK_EVENTS = {
    FEEDBACK_SHOWN: 'feedback_shown',
    FEEDBACK_CHOICE: 'feedback_choice',
    FEEDBACK_SUBMITTED: 'feedback_submitted',
    FEEDBACK_DISMISSED: 'feedback_dismissed',
};
