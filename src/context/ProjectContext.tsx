import { useState, useEffect, useRef, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveProjectData, loadProjectData, cleanUpOrphanedImages, saveImage } from '../utils/imageStore';
import { ProjectContext, LibraryState } from './ProjectContextCore';
import { Project, Frame, WallConfig, LibraryItem } from '../types';
import { importProjectBundle } from '../utils/exportUtils';

interface ProjectData {
    projects: Record<string, Project>;
    currentProjectId: string | null;
    selectedFrameIds: string[];
    selectedImageIds: string[];
    focusedArea: 'canvas' | 'library' | null;
    libraryState: LibraryState;
    frameState: LibraryState;
}

interface HistoryItem {
    projectId: string;
    data: Project;
}

interface HistoryState {
    past: HistoryItem[];
    future: HistoryItem[];
}

const initialData: ProjectData = {
    projects: {}, // { [id]: Project }
    currentProjectId: null,
    selectedFrameIds: [], // Array of frame IDs
    selectedImageIds: [], // Array of image IDs (photo library)
    focusedArea: null, // 'canvas' | 'library' | null
    libraryState: { searchTerm: '', activeFilters: {}, sortBy: 'newest' },
    frameState: { searchTerm: '', activeFilters: {}, sortBy: 'newest' },
};

const createNewProject = (name?: string): Project => ({
    id: uuidv4(),
    name: name || 'Untitled Project',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    wallConfig: {
        type: 'flat', // 'flat', 'staircase', 'corner'
        width: 96, // inches, default 8ft
        height: 72, // inches, default 6ft
        backgroundColor: '#e0e0e0',
        stairAngle: 50, // default rise percentage for staircase walls
    } as WallConfig, // Cast to ensure it matches strict WallConfig if needed (e.g. strict string literals)
    frames: [], // Array of Frame objects
    library: [], // Array of available Frame templates
    images: [], // Array of image IDs
});

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<ProjectData>(initialData);

    const [isLoaded, setIsLoaded] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const hasInitialLoaded = useRef(false);

    // Initial load from IndexedDB
    useEffect(() => {
        if (hasInitialLoaded.current) return;
        hasInitialLoaded.current = true;

        const init = async () => {
            try {
                const idbData = await loadProjectData();
                if (idbData && Object.keys(idbData.projects || {}).length > 0) {
                    setData(idbData);
                } else {
                    // Brand new install - show welcome modal
                    setShowWelcome(true);
                }
            } catch (err) {
                console.error("Failed to load data from IndexedDB", err);
                // Show welcome on error too
                setShowWelcome(true);
            } finally {
                setIsLoaded(true);
                // Garbage Collect Orphaned Images (Async, don't block UI)
                setTimeout(async () => {
                    try {
                        const allData = await loadProjectData();
                        if (!allData || !allData.projects) return;

                        const activeImageIds = new Set<string>();

                        Object.values(allData.projects).forEach((proj: any) => {
                            // Check Frame images
                            proj.frames?.forEach((f: Frame) => {
                                if (f.imageId) activeImageIds.add(f.imageId);
                            });
                            // Check Library images (unused in frames but present in library)
                            // Library items are frames, so they might have imageIds? 
                            // Project structure has 'images' array for "Project Media Library".
                            // This is the source of truth.
                            proj.images?.forEach((imgId: string) => activeImageIds.add(imgId));
                        });

                        const count = await cleanUpOrphanedImages(Array.from(activeImageIds));
                        if (count > 0) console.log(`GC Cleaned ${count} orphaned images.`);
                    } catch (e) {
                        console.warn("GC Failed", e);
                    }
                }, 2000); // Wait 2s for app to settle
            }
        };
        init();
    }, []);

    // Auto-save to IndexedDB
    useEffect(() => {
        if (!isLoaded) return;

        const save = async () => {
            try {
                await saveProjectData(data);
            } catch (err) {
                console.warn("Failed to auto-save to IndexedDB", err);
            }
        };

        const timeoutId = setTimeout(save, 500); // Debounce saves
        return () => clearTimeout(timeoutId);
    }, [data, isLoaded]);

    const addProject = (name: string) => {
        const newProject = createNewProject(name);
        setData(prev => ({
            ...prev,
            projects: { ...prev.projects, [newProject.id]: newProject },
            currentProjectId: newProject.id,
        }));
        return newProject.id;
    };

    const switchProject = (id: string) => {
        if (data.projects[id]) {
            setData(prev => ({ ...prev, currentProjectId: id, selectedFrameIds: [] }));
        }
    };

    const selectFrame = (frameId: string, multi = false) => {
        setData(prev => {
            if (multi) {
                const current = prev.selectedFrameIds || [];
                if (current.includes(frameId)) {
                    return { ...prev, selectedFrameIds: current.filter(id => id !== frameId) };
                }
                return { ...prev, selectedFrameIds: [...current, frameId] };
            }
            return { ...prev, selectedFrameIds: frameId ? [frameId] : [] };
        });
    };

    const deleteProject = (id: string) => {
        setData(prev => {
            const newProjects = { ...prev.projects };
            delete newProjects[id];

            const remainingIds = Object.keys(newProjects);
            let newCurrentId = null;

            if (remainingIds.length === 0) {
                // If it was the last project, create a new one immediately
                const fresh = createNewProject('Untitled Project');
                return {
                    ...prev,
                    projects: { [fresh.id]: fresh },
                    currentProjectId: fresh.id,
                    selectedFrameIds: []
                };
            }

            if (prev.currentProjectId === id) {
                newCurrentId = remainingIds[0];
            } else {
                newCurrentId = prev.currentProjectId;
            }

            return {
                ...prev,
                projects: newProjects,
                currentProjectId: newCurrentId,
                selectedFrameIds: []
            };
        });
    };

    // --- Frame / Library Operations ---

    const addToLibrary = (projectId: string, frameDimensions: Partial<Frame>) => {
        const libraryItem: LibraryItem = {
            // Default Frame properties to satisfy type (LibraryItem extends Frame)
            id: uuidv4(),
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            rotation: 0,
            zIndex: 0,
            shape: 'rect',
            frameColor: '#111',
            // Override with provided partial dimensions
            ...frameDimensions,
            // LibraryItem specific properties
            count: 1,
            createdAt: Date.now()
        };

        setData(prev => {
            const project = prev.projects[projectId];
            if (!project) return prev;

            return {
                ...prev,
                projects: {
                    ...prev.projects,
                    [projectId]: {
                        ...project,
                        library: [...project.library, libraryItem]
                    }
                }
            };
        });
    };

    const removeFromLibrary = (projectId: string, templateId: string) => {
        setData(prev => {
            const project = prev.projects[projectId];
            if (!project) return prev;

            const isUsed = project.frames.some(f => f.templateId === templateId);
            if (isUsed) {
                console.warn("Attempted to remove a template that is in use.");
                return prev;
            }

            return {
                ...prev,
                projects: {
                    ...prev.projects,
                    [projectId]: {
                        ...project,
                        library: project.library.filter(t => t.id !== templateId)
                    }
                }
            };
        });
    };

    // --- Image Library Operations ---

    const addImageToLibrary = (projectId: string, imageId: string) => {
        setData(prev => {
            const project = prev.projects[projectId];
            if (!project) return prev;

            if (project.images && project.images.includes(imageId)) return prev;

            const currentImages = project.images || [];

            return {
                ...prev,
                projects: {
                    ...prev.projects,
                    [projectId]: {
                        ...project,
                        images: [imageId, ...currentImages]
                    }
                }
            };
        });
    };

    const currentProjectRaw = data.currentProjectId ? data.projects[data.currentProjectId] : null;

    const currentProject = currentProjectRaw ? {
        ...currentProjectRaw,
        frames: currentProjectRaw.frames || [],
        library: currentProjectRaw.library || [],
        images: currentProjectRaw.images || [],
        wallConfig: currentProjectRaw.wallConfig || createNewProject().wallConfig
    } : null;

    const setSelection = (ids: string[]) => {
        setData(prev => ({ ...prev, selectedFrameIds: ids }));
    };

    const setSelectedImages = (ids: string[]) => {
        setData(prev => ({ ...prev, selectedImageIds: ids }));
    };

    const setFocusedArea = (area: 'canvas' | 'library' | null) => {
        setData(prev => ({ ...prev, focusedArea: area }));
    };

    const updateLibraryState = (updates: Partial<LibraryState>) => {
        setData(prev => ({
            ...prev,
            libraryState: { ...prev.libraryState, ...updates }
        }));
    };

    const updateFrameState = (updates: Partial<LibraryState>) => {
        setData(prev => ({
            ...prev,
            frameState: { ...prev.frameState, ...updates }
        }));
    };

    // --- History State & Undo/Redo ---
    const [history, setHistory] = useState<HistoryState>({
        past: [],
        future: []
    });

    const pushToHistory = (projectId: string) => {
        const currentMemento = data.projects[projectId];
        if (!currentMemento) return;

        setHistory(prev => {
            const newPast: HistoryItem[] = [...prev.past, { projectId, data: structuredClone(currentMemento) }];
            if (newPast.length > 50) {
                newPast.shift(); // Remove oldest
            }
            return {
                past: newPast,
                future: []
            };
        });
    };

    const undo = () => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;

            const newPast = [...prev.past];
            const previousState = newPast.pop();
            // previousState is HistoryItem | undefined, but length check ensures it's defined
            if (!previousState) return prev;

            const { projectId, data: oldProjectData } = previousState;

            const currentProjectData = data.projects[projectId];

            const newFuture = [...prev.future, { projectId, data: structuredClone(currentProjectData) }];

            setData(d => ({
                ...d,
                projects: {
                    ...d.projects,
                    [projectId]: oldProjectData
                }
            }));

            return { past: newPast, future: newFuture };
        });
    };

    const redo = () => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev;

            const newFuture = [...prev.future];
            const nextState = newFuture.pop();
            if (!nextState) return prev;

            const { projectId, data: nextProjectData } = nextState;

            const currentProjectData = data.projects[projectId];

            const newPast = [...prev.past, { projectId, data: structuredClone(currentProjectData) }];

            setData(d => ({
                ...d,
                projects: {
                    ...d.projects,
                    [projectId]: nextProjectData
                }
            }));

            return { past: newPast, future: newFuture };
        });
    };

    const updateProject = (id: string, updates: Partial<Project>, skipHistory = false) => {
        if (!skipHistory) {
            pushToHistory(id);
        }
        setData(prev => ({
            ...prev,
            projects: {
                ...prev.projects,
                [id]: { ...prev.projects[id], ...updates, updatedAt: Date.now() }
            }
        }));
    };

    // Import demo project from bundled example.gwall
    const importDemoProject = async () => {
        try {
            // Use import.meta.env.BASE_URL to respect vite's base config
            const baseUrl = import.meta.env.BASE_URL || '/';
            const response = await fetch(`${baseUrl}example.gwall`);
            if (!response.ok) throw new Error('Failed to fetch demo project');
            const blob = await response.blob();

            const { project, images } = await importProjectBundle(blob);

            const idMap = new Map<string, string>();
            const remappedImages: { id: string; blob: Blob }[] = [];

            for (const img of images) {
                const newId = uuidv4();
                idMap.set(img.id, newId);
                remappedImages.push({ id: newId, blob: img.blob });
            }

            const updatedFrames = project.frames.map((f: any) => ({
                ...f,
                imageId: f.imageId ? (idMap.get(f.imageId) || null) : null
            }));

            const updatedImagesArray = project.images ? project.images
                .filter((id: any) => idMap.has(id))
                .map((id: any) => idMap.get(id)) : [];

            for (const img of remappedImages) {
                await saveImage(img.id, img.blob);
            }

            const newProject = createNewProject(project.name || 'Demo Gallery');
            const projectWithData = {
                ...newProject,
                frames: updatedFrames,
                wallConfig: project.wallConfig || newProject.wallConfig,
                library: project.library || [],
                images: updatedImagesArray
            };

            const newData = {
                ...data,
                projects: { ...data.projects, [newProject.id]: projectWithData },
                currentProjectId: newProject.id
            };

            setData(newData);
            await saveProjectData(newData);
            setShowWelcome(false);
        } catch (err) {
            console.error('Failed to import demo project:', err);
            throw err;
        }
    };

    // Start with a fresh empty project
    const startFresh = () => {
        const fresh = createNewProject('Untitled Project');
        const freshData = {
            ...initialData,
            projects: { [fresh.id]: fresh },
            currentProjectId: fresh.id
        };
        setData(freshData);
        saveProjectData(freshData);
        setShowWelcome(false);
    };

    return (
        <ProjectContext.Provider value={{
            projects: data.projects,
            currentProject,
            currentProjectId: data.currentProjectId,
            selectedFrameIds: data.selectedFrameIds || [],
            selectedImageIds: data.selectedImageIds || [],
            focusedArea: data.focusedArea,
            isLoaded,
            addProject,
            switchProject,
            deleteProject,
            updateProject,
            addToLibrary,
            removeFromLibrary,
            addImageToLibrary,
            selectFrame,
            setSelection,
            setSelectedImages,
            setFocusedArea,
            libraryState: data.libraryState || initialData.libraryState,
            frameState: data.frameState || initialData.frameState,
            updateLibraryState,
            updateFrameState,
            undo,
            redo,
            canUndo: history.past.length > 0,
            canRedo: history.future.length > 0,
            showWelcome,
            importDemoProject,
            startFresh
        }}>
            {children}
        </ProjectContext.Provider>
    );
};
