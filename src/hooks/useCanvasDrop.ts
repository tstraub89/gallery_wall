import { RefObject } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveImage } from '../utils/imageStore';
import { PPI, DEFAULT_FRAME_BORDER_WIDTH, DEFAULT_FRAME_COLOR } from '../constants';
import { Project, Frame } from '../types';
import { ProjectContextType } from '../context/ProjectContextCore';

interface UseCanvasDropProps {
    containerRef: RefObject<HTMLDivElement | null>;
    scale: number;
    pan: { x: number; y: number };
    currentProject: Project | null;
    updateProject: ProjectContextType['updateProject'];
    addImageToLibrary: ProjectContextType['addImageToLibrary'];
    frameSelector: string;
}

export const useCanvasDrop = ({
    containerRef,
    scale,
    pan,
    currentProject,
    updateProject,
    addImageToLibrary,
    frameSelector
}: UseCanvasDropProps) => {

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, snap: (val: number) => number) => {
        e.preventDefault();
        if (!currentProject) return;

        // 1. Handle File Drops (Upload Image)
        if (e.dataTransfer.files?.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                try {
                    const imageId = uuidv4();
                    await saveImage(imageId, file);
                    addImageToLibrary(currentProject.id, imageId);

                    // Check if dropped ONTO a frame
                    const tempTarget = e.target as HTMLElement;
                    const frameEl = tempTarget.closest(`.${frameSelector}`);
                    if (frameEl) {
                        const frameId = frameEl.getAttribute('data-frame-id');
                        if (frameId) {
                            const updatedFrames = currentProject.frames.map(f => f.id === frameId ? { ...f, imageId, imageState: null } : f);
                            updateProject(currentProject.id, { frames: updatedFrames });
                        }
                    }
                } catch (err) {
                    console.error("Failed to save image", err);
                }
            }
            return;
        }

        // 2. Handle Library Item Drops
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;

        try {
            const d = JSON.parse(dataStr);

            // New Frame from Library
            if (d.type === 'FRAME_LIBRARY_ITEM') {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const widthPx = d.frame.width * PPI;
                const heightPx = d.frame.height * PPI;

                // Calculate drop position in World Coordinates
                const worldX = snap(((e.clientX - rect.left) - pan.x) / scale - (widthPx / 2));
                const worldY = snap(((e.clientY - rect.top) - pan.y) / scale - (heightPx / 2));

                const newFrame: Frame = {
                    id: uuidv4(),
                    templateId: d.frame.id,
                    width: d.frame.width,
                    height: d.frame.height,
                    label: d.frame.label,
                    shape: d.frame.shape || 'rect',
                    frameColor: d.frame.frameColor || DEFAULT_FRAME_COLOR,
                    matted: d.frame.matted,
                    borderWidth: typeof d.frame.borderWidth === 'number' ? d.frame.borderWidth : DEFAULT_FRAME_BORDER_WIDTH,
                    x: worldX, y: worldY,
                    rotation: 0,
                    zIndex: currentProject.frames.length + 1,
                    imageId: null,
                    imageState: null
                };
                updateProject(currentProject.id, { frames: [...currentProject.frames, newFrame] });
            }

            // Photo from Library dropped onto existing Frame
            if (d.type === 'PHOTO_LIBRARY_ITEM') {
                const tempTarget = e.target as HTMLElement;
                const frameEl = tempTarget.closest(`.${frameSelector}`);
                if (frameEl) {
                    const frameId = frameEl.getAttribute('data-frame-id');
                    if (frameId) {
                        const updatedFrames = currentProject.frames.map(f => f.id === frameId ? { ...f, imageId: d.imageId, imageState: null } : f);
                        updateProject(currentProject.id, { frames: updatedFrames });
                    }
                }
            }
        } catch (err) {
            console.error("Drop error", err);
        }
    };

    return {
        handleDrop,
        handleDragOver
    };
};
