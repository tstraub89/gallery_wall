# 🗺️ GalleryPlanner Roadmap & Future Goals

## 🤖 features & AI
- [ ] **Local AI Gallery Wall**: "Fully Automated automated AI gallery wall".
    - **Concept**: A tool that places frames and picks photos automatically.
    - **Tech**: Light-weight neural net for face detection + image processing heuristics + artistic rules.
    - **Privacy**: 100% local execution. No photo uploads. "Privacy First."
- [x] **Gallery Wall Template Packs**: Pre-designed layouts for users who don't have frames yet (e.g., "The Grid", "The Spiral", "Staircase Special").

## 🎨 UX & Interface
- [x] **Library View Options**: Enhanced viewing modes for photos and frames.
    - **Frame Tiles/Icons**: Grid view for frames showing shape and size overlay, mirroring the canvas appearance.
    - **Flexible Photo Grid**: Toggle between small, medium, and large previews (e.g., 1, 2, or 3 columns).
    - **Detailed List View**: Alternative row-based view for photos/frames showing metadata like name, resolution (MP), and aspect ratio.

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
