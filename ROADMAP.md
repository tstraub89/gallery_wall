# 🗺️ GalleryPlanner Roadmap & Future Goals

## 🤖 Features & AI
- [x] **Smart Fill (AI)**: "Fully Automated automated AI gallery wall".
    - **Status**: Phase 1 complete (Composition analysis, Face detection, Harmony matching).
    - **Future (Smart Fill v2)**: 
        - **Holistic Composition**: Move beyond frame-by-frame filling to look at the wall total. Apply artistic rules (e.g., 30/70 rule for color/bw ratios, focal point selection).
        - **Solution Browser**: Replace "Lucky" button with a generator that proposes ~10 complete gallery solutions to choose from.
        - **Smart Cropping**: Use AI face coordinates to automatically suggest the best crop for every frame.
    - **Privacy**: 100% local execution. No photo uploads. "Privacy First."
- [x] **Gallery Wall Template Packs**: Pre-designed layouts for users who don't have frames yet (e.g., "The Grid", "The Spiral", "Staircase Special").

## 🎨 UX & Interface
- [x] **✨ Playground Mode**: Full Pro feature exposure via the Example Gallery.
- [ ] **Deep Link Sharing**: Share a read-only (or editable) project via a single URL (compressed project data in hash).
- [x] **Library View Options**: Enhanced viewing modes for photos and frames.
    - **Frame Tiles/Icons**: Grid view for frames showing shape and size overlay, mirroring the canvas appearance.
    - **Flexible Photo Grid**: Toggle between small, medium, and large previews (e.g., 1, 2, or 3 columns).
    - **Detailed List View**: Alternative row-based view for photos/frames showing metadata like name, resolution (MP), and aspect ratio.

## 📱 Mobile Experience
- [ ] **Mobile Parity**: Bring core Desktop features to the mobile experience.
    - **Frame Templates**: Enable the "Template Pack" browser on mobile devices for quick layout generation.
    - **Smart Fill**: Adapt the Smart Fill sidebar and suggestions for smaller screens.

## 💰 Monetization & Pro (Low Priority - Beta Phase)
- [ ] **Stripe Integration**:
    - *Status*: On hold for extended beta.
    - *Decision needed*: Build a custom checkout page vs. integrating into the new website structure.
- [ ] **Server-Side Verification**: Implement robust PRO status verification tied to Stripe purchases (replacing the current client-side only check).

## 📢 Marketing & Content
- [x] **Blog / Content Hub**:
    - **Goal**: Drive SEO/AIO traffic.
    - **Strategy**: AI-generated content is acceptable. Focus on "How to hang a gallery wall", "Interior design tips", etc.
- [x] **Visual Demos**: Create GIFs or short web videos demonstrating app usage (Drag & Drop, Auto-Arrange, etc.) to immediately show value.
- [ ] **Social Promotion**: Reddit & Pinterest campaigns.

## ☁️ Infrastructure & Philosophy
- [ ] **Cloud Integration?**
    - *Discussion point*: Does this go against the "Local Only" philosophy?
    - Potential for "Optional Cloud" for cross-device syncing without forcing it.

## 🛡️ Infrastructure & Security
- [x] **Reverse Proxy (PostHog)**: Bypassing content blockers for reliable analytics.
- [x] **Security Headers**: Implementation of CSP, HSTS, and COOP/CORP.
- [x] **Performance Optimization**: Improved LCP, async font loading, and WebP migration.
