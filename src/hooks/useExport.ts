import { useState } from 'react';
import { useProject } from './useProject';
import { exportCanvasToBlob, generateProjectZip, exportProjectBundle, saveFile } from '../utils/exportUtils';
import { trackEvent, PRO_EVENTS } from '../utils/analytics';

export const useExport = () => {
    const { currentProject } = useProject();
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const getSafeFilename = (name: string, ext: string) => {
        const safeName = (name || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return `${safeName}.${ext}`;
    };

    // Export as PNG (Download)
    const exportToPng = async (overrideName?: string) => {
        if (!currentProject) return;
        trackEvent(PRO_EVENTS.PNG_EXPORT);
        setIsExporting(true);
        setExportError(null);

        const fileName = getSafeFilename(overrideName || currentProject.name, 'png');

        const { blob, error } = await exportCanvasToBlob(currentProject, { cropToFrames: true });

        if (blob) {
            await saveFile(blob, fileName);
        }

        if (error) {
            setExportError(error);
        }

        setIsExporting(false);
    };

    // Share as PNG (Native Share Sheet)
    const shareProjectImage = async (): Promise<boolean> => {
        if (!currentProject) return false;
        setIsExporting(true);
        setExportError(null);

        const title = currentProject.name || 'My Gallery Wall';
        const fileName = getSafeFilename(title, 'png');

        const { blob, error } = await exportCanvasToBlob(currentProject, { cropToFrames: true });

        if (error) {
            setExportError(error);
        }

        if (!blob) {
            setIsExporting(false);
            return false;
        }

        // Check for Web Share API support
        if (navigator.share) {
            try {
                const file = new File([blob], fileName, { type: 'image/png' });
                const shareData: ShareData = {
                    title: title,
                    text: 'Check out my gallery wall design!',
                    files: [file]
                };

                if (navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    setIsExporting(false);
                    return true;
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                    setExportError('Share unavailable');
                }
                // Don't fallback to download if share was aborted or failed explicitly, 
                // but if it's "not supported" we fall through? 
                // Actually the check `navigator.share` handles support.
                // If it fails, we probably shouldn't force download on mobile unless requested.
            }
        } else {
            // Fallback: Trigger download if sharing fails/not supported (Desktop behavior)
            // Use Robust Save
            await saveFile(blob, fileName);
        }

        setIsExporting(false);
        return false;
    };

    // Export .gwall Project File
    const exportToGwall = async () => {
        if (!currentProject) return;
        trackEvent(PRO_EVENTS.GWALL_EXPORT);
        setIsExporting(true);
        try {
            // Note: exportProjectBundle handles saveAs internally, we should probably verify it uses the name
            // but for now let's leave it or updated it there? 
            // Actually let's assume exportUtils does it right, but update exportUtils if needed.
            const result = await exportProjectBundle(currentProject);
            if (result.errorCount > 0) {
                setExportError(`Export finished with ${result.errorCount} warnings.`);
            }
        } catch (err: any) {
            setExportError(err.message);
        } finally {
            setIsExporting(false);
        }
    };

    // Export Photos ZIP
    const exportPhotosCrops = async () => {
        if (!currentProject) return;
        trackEvent(PRO_EVENTS.ZIP_EXPORT);
        setIsExporting(true);
        try {
            await generateProjectZip(currentProject);
        } catch (err: any) {
            setExportError(err.message);
        } finally {
            setIsExporting(false);
        }
    };


    return {
        isExporting,
        exportError,
        setExportError,
        exportToPng,
        shareProjectImage,
        exportToGwall,
        exportPhotosCrops
    };
};
