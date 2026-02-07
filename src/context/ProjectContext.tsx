import { useState, useEffect, useRef, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveProjectData, loadProjectData, cleanUpOrphanedImages, saveImage, clearImageCache, getImageMetadata } from '../utils/imageStore';
import { ProjectContext, LibraryState } from './ProjectContextCore';
import { Project, Frame, WallConfig, LibraryItem, Template } from '../types';
import templates from '../data/templates.json';
import { PPI } from '../constants';
import { importProjectBundle } from '../utils/exportUtils';
import { trackEvent, APP_EVENTS } from '../utils/analytics';

interface ProjectData {
    projects: Record<string, Project>;
    currentProjectId: string | null;
    libraryState: LibraryState;
    frameState: LibraryState;
    imagesMetadata: Record<string, any>;
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
    libraryState: { searchTerm: '', activeFilters: {}, sortBy: 'newest' },
    frameState: { searchTerm: '', activeFilters: {}, sortBy: 'newest' },
    imagesMetadata: {}
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
    } as WallConfig,
    frames: [], // Array of Frame objects
    library: [], // Array of available Frame templates
    images: [], // Array of image IDs
});

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<ProjectData>(initialData);

    const [isLoaded, setIsLoaded] = useState(false);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
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
                    // Filter out legacy selection fields if they exist in IDB
                    const cleanData: ProjectData = {
                        projects: idbData.projects,
                        currentProjectId: idbData.currentProjectId,
                        libraryState: idbData.libraryState || initialData.libraryState,
                        frameState: idbData.frameState || initialData.frameState,
                        imagesMetadata: initialData.imagesMetadata
                    };

                    // Fetch metadata for ALL images in ALL projects to be safe? 
                    // Or just the current one? Let's do all for now since they might switch.
                    const allImageIds = new Set<string>();
                    Object.values(idbData.projects).forEach((p: any) => {
                        p.images?.forEach((id: string) => allImageIds.add(id));
                        p.frames?.forEach((f: Frame) => { if (f.imageId) allImageIds.add(f.imageId); });
                    });

                    if (allImageIds.size > 0) {
                        try {
                            const meta = await getImageMetadata(Array.from(allImageIds));
                            cleanData.imagesMetadata = meta;
                        } catch (e) {
                            console.warn("Failed to load image metadata", e);
                        }
                    }

                    setData(cleanData);
                } else {
                    setShowWelcome(true);
                }
            } catch (err) {
                console.error("Failed to load data from IndexedDB", err);
                setShowWelcome(true);
            } finally {
                setIsLoaded(true);
                setTimeout(async () => {
                    try {
                        const allData = await loadProjectData();
                        if (!allData || !allData.projects) return;

                        const activeImageIds = new Set<string>();

                        Object.values(allData.projects).forEach((proj: any) => {
                            proj.frames?.forEach((f: Frame) => {
                                if (f.imageId) activeImageIds.add(f.imageId);
                            });
                            proj.images?.forEach((imgId: string) => activeImageIds.add(imgId));
                        });

                        const count = await cleanUpOrphanedImages(Array.from(activeImageIds));
                        if (count > 0) console.log(`GC Cleaned ${count} orphaned images.`);
                    } catch (e) {
                        console.warn("GC Failed", e);
                    }
                }, 2000);
            }
        };
        init();
    }, []);

    // Auto-save to IndexedDB
    useEffect(() => {
        if (!isLoaded) return;

        const save = async () => {
            try {
                // Save complete object, ignoring selection fields for persistence
                await saveProjectData(data);
            } catch (err) {
                console.warn("Failed to auto-save to IndexedDB", err);
            }
        };

        const timeoutId = setTimeout(save, 500); // Debounce saves
        return () => clearTimeout(timeoutId);
    }, [data, isLoaded]);

    const addProject = (name: string) => {
        trackEvent(APP_EVENTS.SAVE_PROJECT);
        const newProject = createNewProject(name);
        setData(prev => ({
            ...prev,
            projects: { ...prev.projects, [newProject.id]: newProject },
            currentProjectId: newProject.id,
        }));
        return newProject.id;
    };

    const switchProject = async (id: string) => {
        if (data.projects[id]) {
            setIsProjectLoading(true);
            setTimeout(() => {
                clearImageCache();
                setData(prev => ({ ...prev, currentProjectId: id }));
                setIsProjectLoading(false);
            }, 300);
        }
    };

    const deleteProject = (id: string) => {
        const remainingIds = Object.keys(data.projects).filter(pid => pid !== id);

        if (remainingIds.length === 0) {
            clearImageCache();
            setData(prev => ({
                ...prev,
                projects: {},
                currentProjectId: null,
            }));
            setShowWelcome(true);
            return;
        }

        setData(prev => {
            const newProjects = { ...prev.projects };
            delete newProjects[id];

            let newCurrentId = prev.currentProjectId;

            if (prev.currentProjectId === id) {
                clearImageCache();
                newCurrentId = Object.keys(newProjects)[0] || null;
            }

            return {
                ...prev,
                projects: newProjects,
                currentProjectId: newCurrentId,
            };
        });
    };

    // --- Frame / Library Operations ---

    const addToLibrary = (projectId: string, frameDimensions: Partial<Frame>) => {
        const libraryItem: LibraryItem = {
            id: uuidv4(),
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            rotation: 0,
            zIndex: 0,
            shape: 'rect',
            frameColor: '#111',
            ...frameDimensions,
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

    const addImageToLibrary = (projectId: string, imageId: string, metadata?: any) => {
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
                },
                imagesMetadata: metadata ? { ...prev.imagesMetadata, [imageId]: metadata } : prev.imagesMetadata
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
            if (!previousState) return prev;

            const { projectId, data: oldProjectData } = previousState;

            // const currentProjectData = data.projects[projectId]; 
            // We need to push CURRENT state to future before restoring OLD state
            const currentMemento = data.projects[projectId];

            const newFuture = [...prev.future, { projectId, data: structuredClone(currentMemento) }];

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

            const currentMemento = data.projects[projectId];

            const newPast = [...prev.past, { projectId, data: structuredClone(currentMemento) }];

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

    const applyTemplate = (projectId: string, templateId: string) => {
        // Use require/import to get templates data
        const templatesData = templates as Template[];
        const template = templatesData.find(t => t.id === templateId);

        if (!template) {
            console.error(`Template ${templateId} not found`);
            return;
        }

        const project = data.projects[projectId];
        if (!project) return;

        // SMART REPLACE LOGIC
        // If active template exists, remove its frames and library items
        let currentFrames = [...project.frames];
        let currentLibrary = [...project.library];

        if (project.activeTemplateId) {
            // 1. Find library items from the previous template
            const previousLibraryItems = currentLibrary.filter(l => l.templateId === project.activeTemplateId);
            const previousLibraryIds = new Set(previousLibraryItems.map(l => l.id));

            // 2. Remove frames linked to those library items (or linked directly to templateId for legacy compatibility)
            currentFrames = currentFrames.filter(f =>
                f.templateId !== project.activeTemplateId &&
                (!f.templateId || !previousLibraryIds.has(f.templateId))
            );

            // 3. Remove the library items themselves
            currentLibrary = currentLibrary.filter(l => l.templateId !== project.activeTemplateId);
        }

        // Center of the wall in PIXELS
        const centerX = (project.wallConfig.width * PPI) / 2;
        const centerY = (project.wallConfig.height * PPI) / 2;

        // CREATE NEW ITEMS
        // 1. Create Library Items FIRST to generate IDs
        const newLibraryItems: LibraryItem[] = template.frames.map((tf) => ({
            id: uuidv4(),
            width: tf.width,
            height: tf.height,
            x: 0, y: 0,
            rotation: 0,
            zIndex: 0,
            shape: tf.shape || 'rect',
            frameColor: tf.frameColor || '#111111',
            count: 1, // Represents "1 on wall"
            createdAt: Date.now(),
            templateId: templateId, // Links to Template Pack
            label: `${template.name} (${tf.label || 'Frame'})`
        }));

        // 2. Create Frames linked to Library Items
        const newFrames: Frame[] = template.frames.map((tf, index) => {
            // Dimensions are stored in INCHES
            const width = tf.width;
            const height = tf.height;
            const libraryItemId = newLibraryItems[index].id;

            // Position is stored in PIXELS
            // We interpret tf.x/y as INCHES relative to center
            const xOffsetPx = tf.x * PPI;
            const yOffsetPx = tf.y * PPI;
            const halfWidthPx = (width * PPI) / 2;
            const halfHeightPx = (height * PPI) / 2;

            return {
                id: uuidv4(),
                width: width,
                height: height,
                x: centerX + xOffsetPx - halfWidthPx,
                y: centerY + yOffsetPx - halfHeightPx,
                rotation: tf.rotation || 0,
                zIndex: (currentFrames.length || 0) + 1,
                imageId: null,
                imageState: null,
                borderWidth: tf.borderWidth || 0.5,
                frameColor: tf.frameColor || '#111111',
                matted: tf.matted || null,
                shape: tf.shape || 'rect',
                locked: false,
                templateId: libraryItemId, // Links to specific Library Item (enables "Placed" check)
                label: tf.label || `Template Frame`
            };
        });

        updateProject(projectId, {
            frames: [...currentFrames, ...newFrames],
            library: [...currentLibrary, ...newLibraryItems],
            activeTemplateId: templateId
        });
    };

    const updateProject = (id: string, updates: Partial<Project>, skipHistory = false) => {
        if (!skipHistory) {
            pushToHistory(id);
        }

        // If frames are being updated manually (moved/resized), clear the active template state
        // This "commits" the template frames so they aren't auto-replaced next time
        if (updates.frames && updates.activeTemplateId === undefined) {
            // We define undefined check because applyTemplate PASSES activeTemplateId
            updates.activeTemplateId = null;
        }

        setData(prev => ({
            ...prev,
            projects: {
                ...prev.projects,
                [id]: { ...prev.projects[id], ...updates, updatedAt: Date.now() }
            }
        }));
    };

    const importDemoProject = async () => {
        trackEvent(APP_EVENTS.LOAD_PROJECT);
        setIsProjectLoading(true);
        try {
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
                await saveImage(img.id, img.blob, { skipOptimization: true });
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
        } finally {
            setIsProjectLoading(false);
        }
    };

    const startFresh = () => {
        trackEvent(APP_EVENTS.SAVE_PROJECT);
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
            isLoaded,
            isProjectLoading,
            addProject,
            switchProject,
            setProjectLoading: setIsProjectLoading,
            deleteProject,
            updateProject,
            addToLibrary,
            removeFromLibrary,
            addImageToLibrary,
            applyTemplate,
            imagesMetadata: data.imagesMetadata || initialData.imagesMetadata,
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
