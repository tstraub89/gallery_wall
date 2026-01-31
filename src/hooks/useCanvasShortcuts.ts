import { useEffect } from 'react';
import { Project } from '../types';
import { ProjectContextType } from '../context/ProjectContextCore';

interface UseCanvasShortcutsProps {
    currentProject: Project | null;
    selectedFrameIds: string[];
    focusedArea: 'canvas' | 'library' | 'properties';
    updateProject: ProjectContextType['updateProject'];
    setSelection: ProjectContextType['setSelection'];
    setSelectedImages: ProjectContextType['setSelectedImages'];
    undo: () => void;
    redo: () => void;
    duplicateSelected: () => void;
    handleDeleteFrame: (frameIdOrIds: string | string[]) => void;
    setSnapToGrid: React.Dispatch<React.SetStateAction<boolean>>;
    setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useCanvasShortcuts = ({
    currentProject,
    selectedFrameIds,
    focusedArea,
    updateProject,
    setSelection,
    setSelectedImages,
    undo,
    redo,
    duplicateSelected,
    handleDeleteFrame,
    setSnapToGrid,
    setShowGrid
}: UseCanvasShortcutsProps) => {
    useEffect(() => {
        if (!currentProject) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

            // Select All
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                if (focusedArea === 'library' && currentProject.images?.length > 0) {
                    setSelectedImages([...currentProject.images]);
                } else {
                    setSelection(currentProject.frames.map(f => f.id));
                }
            }

            // Delete
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (focusedArea === 'canvas' && selectedFrameIds.length > 0) {
                    e.preventDefault();
                    handleDeleteFrame(selectedFrameIds);
                }
            }

            // Duplicate (Ctrl+D)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                // Only duplicate if we are focused on the canvas (prevents triggering in modals/library)
                if (focusedArea === 'canvas') {
                    duplicateSelected();
                }
            }

            // Undo / Redo
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo(); else undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
            }

            // Nudge (Arrow Keys)
            const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
            if (isArrowKey && focusedArea === 'canvas' && selectedFrameIds.length > 0) {
                e.preventDefault();
                const distance = e.shiftKey ? 10 : 1;
                let dx = 0, dy = 0;
                if (e.key === 'ArrowUp') dy = -distance;
                if (e.key === 'ArrowDown') dy = distance;
                if (e.key === 'ArrowLeft') dx = -distance;
                if (e.key === 'ArrowRight') dx = distance;

                const updatedFrames = currentProject.frames.map(f => {
                    if (selectedFrameIds.includes(f.id)) {
                        return { ...f, x: f.x + dx, y: f.y + dy };
                    }
                    return f;
                });
                updateProject(currentProject.id, { frames: updatedFrames });
            }

            // Toggle Snapping (S)
            if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
                setSnapToGrid(prev => !prev);
            }

            // Toggle Grid (#)
            if (e.key === '#') {
                setShowGrid(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        currentProject,
        selectedFrameIds,
        focusedArea,
        updateProject,
        setSelection,
        setSelectedImages,
        undo,
        redo,
        duplicateSelected,
        handleDeleteFrame,
        setSnapToGrid,
        setShowGrid
    ]);
};
