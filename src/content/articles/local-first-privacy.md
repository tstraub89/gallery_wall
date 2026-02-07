# Why Your Home Data Should Stay Home: The Local-First Advantage

When you upload family photos to design a gallery wall, where do those images go? With most apps, your intimate family moments get sent to company servers, potentially analyzed by AI, and stored in databases you don't control.

With GalleryPlanner, the answer is simple: **nowhere**. Your photos never leave your device.

## The Problem with Cloud-First Apps

Most design apps work like this: you upload your photo, it goes to a server, gets processed, and stays in "the cloud." From there, those images might be analyzed by AI, stored indefinitely, or exposed in data breaches.

| Cloud App Pattern | Privacy Risk |
|-------------------|--------------|
| 1. Upload photo | Data leaves your device |
| 2. Processing | Potential AI training |
| 3. Storage | Subject to breaches |
| 4. Sharing | Third-party access |

This isn't paranoia—it's the business model for most free apps.

---

## How GalleryPlanner Is Different

GalleryPlanner uses a **local-first architecture**, which means your data lives on your device and stays there.

| Feature | Cloud-First Apps | GalleryPlanner |
|---------|------------------|----------------|
| Photo storage | Company servers | Your browser only |
| Data ownership | Terms of service | You own everything |
| Works offline | Requires internet | Full functionality |
| Account required | Usually | No |
| AI training | Often yes | Never |

When you drag a photo into GalleryPlanner, it goes into **IndexedDB**—a secure, local database built into your browser. We literally can't see your photos because they never reach us.

---

## What "Local-First" Means

Your data lives on your device using browser-native storage:

| Component | Where It's Stored |
|-----------|-------------------|
| Your photos | Browser IndexedDB |
| Project files | Browser IndexedDB |
| Settings | Browser localStorage |
| Exports | Your Downloads folder |

**Nothing is transmitted.** No servers. No accounts. No cloud sync.

---

## Privacy Benefits

### Your Photos Stay Private

| Photo Type | Cloud Risk | GalleryPlanner |
|------------|------------|----------------|
| Wedding photos | Server storage | Never uploaded |
| Kids' pictures | Potential AI use | 100% private |
| Home interior | Security risk | Only you see it |

### No Data Collection

| What Cloud Apps Collect | We Collect |
|-------------------------|------------|
| Email, name | Nothing |
| Usage patterns | Nothing |
| Photo metadata | Nothing |

---

## Speed and Reliability Benefits

Privacy isn't the only advantage. When your data doesn't travel over the internet:

| Action | Cloud App | GalleryPlanner |
|--------|-----------|----------------|
| Load a photo | 1-5 seconds | Instant |
| Save project | Depends on upload | Instant |
| Internet down | Won't work | Full functionality |

---

## The Trade-Offs (Honestly)

Local-first has limitations:

| Feature | Trade-Off | Workaround |
|---------|-----------|------------|
| Multi-device sync | Not automatic | Export/import project files |
| Collaboration | No real-time | Share exported PDFs |
| Cloud backup | Not built-in | Save files to your own cloud |

**Pro tip:** Export your project file regularly and save it to Google Drive, iCloud, or Dropbox for backup.

---

## How We Make Money

If we don't sell data, how does GalleryPlanner work?

| Revenue Source | Description |
|----------------|-------------|
| Pro features | Premium layouts, PDF exports |
| Future: Templates | Pre-made designs |
| Future: Partnerships | Frame shop integrations (opt-in) |

**We will never:** Sell your data, show ads, or require accounts for core features.

---

## Comparison

| Privacy | GalleryPlanner | Pinterest | Canva |
|---------|----------------|-----------|-------|
| Photos uploaded? | ❌ No | ✅ Yes | ✅ Yes |
| Used for AI? | ❌ No | ✅ Yes | ✅ Yes |
| Account required? | ❌ No | ✅ Yes | ✅ Yes |

---

## Related Resources

- [Getting Started with GalleryPlanner](/learn/getting-started-with-galleryplanner)
- [GalleryPlanner: Complete User Guide](/learn/galleryplanner-user-guide)
- [Our Privacy Policy](/privacy)

**Ready to design with privacy?** [Launch GalleryPlanner →](/)
