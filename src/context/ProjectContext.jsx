import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveProjectData, loadProjectData } from '../utils/imageStore';
import { ProjectContext } from './ProjectContextCore';

const initialData = {
    projects: {}, // { [id]: Project }
    currentProjectId: null,
    selectedFrameIds: [], // Array of frame IDs
    selectedImageIds: [], // Array of image IDs (photo library)
    focusedArea: null, // 'canvas' | 'library' | null
    libraryState: { searchTerm: '', activeFilters: {}, sortBy: 'newest' },
    frameState: { searchTerm: '', activeFilters: {}, sortBy: 'newest' },
};

const createNewProject = (name) => ({
    id: uuidv4(),
    name: name || 'Untitled Project',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    wallConfig: {
        type: 'flat', // 'flat', 'staircase', 'corner'
        width: 300, // inches, default 25ft
        height: 120, // inches, default 10ft
        backgroundColor: '#e0e0e0',
        backgroundImage: null,
    },
    frames: [], // Array of Frame objects
    library: [], // Array of available Frame templates
    images: [], // Array of image IDs
});

export const ProjectProvider = ({ children }) => {
    const [data, setData] = useState(initialData);

    const [isLoaded, setIsLoaded] = useState(false);
    const hasInitialLoaded = useRef(false);

    // Initial load from IndexedDB
    useEffect(() => {
        if (hasInitialLoaded.current) return;
        hasInitialLoaded.current = true;

        const init = async () => {
            try {
                const idbData = await loadProjectData();
                if (idbData) {
                    setData(idbData);
                } else {
                    // Brand new install
                    const fresh = createNewProject('Untitled Project');
                    const freshData = {
                        ...initialData,
                        projects: { [fresh.id]: fresh },
                        currentProjectId: fresh.id
                    };
                    setData(freshData);
                    await saveProjectData(freshData);
                }
            } catch (err) {
                console.error("Failed to load data from IndexedDB", err);
            } finally {
                setIsLoaded(true);
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

    const addProject = (name) => {
        const newProject = createNewProject(name);
        setData(prev => ({
            ...prev,
            projects: { ...prev.projects, [newProject.id]: newProject },
            currentProjectId: newProject.id,
        }));
        return newProject.id;
    };

    const switchProject = (id) => {
        if (data.projects[id]) {
            setData(prev => ({ ...prev, currentProjectId: id, selectedFrameIds: [] }));
        }
    };

    const selectFrame = (frameId, multi = false) => {
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

    const deleteProject = (id) => {
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

    const addToLibrary = (projectId, frameDimensions) => {
        const libraryItem = {
            id: uuidv4(),
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

    const removeFromLibrary = (projectId, templateId) => {
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

    const addImageToLibrary = (projectId, imageId) => {
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

    const setSelection = (ids) => {
        setData(prev => ({ ...prev, selectedFrameIds: ids }));
    };

    const setSelectedImages = (ids) => {
        setData(prev => ({ ...prev, selectedImageIds: ids }));
    };

    const setFocusedArea = (area) => {
        setData(prev => ({ ...prev, focusedArea: area }));
    };

    const updateLibraryState = (updates) => {
        setData(prev => ({
            ...prev,
            libraryState: { ...prev.libraryState, ...updates }
        }));
    };

    const updateFrameState = (updates) => {
        setData(prev => ({
            ...prev,
            frameState: { ...prev.frameState, ...updates }
        }));
    };

    // --- History State & Undo/Redo ---
    const [history, setHistory] = useState({
        past: [],
        future: []
    });

    const pushToHistory = (projectId) => {
        const currentMemento = data.projects[projectId];
        if (!currentMemento) return;

        setHistory(prev => ({
            past: [...prev.past, { projectId, data: structuredClone(currentMemento) }],
            future: []
        }));
    };

    const undo = () => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;

            const newPast = [...prev.past];
            const previousState = newPast.pop();
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

    const updateProject = (id, updates, skipHistory = false) => {
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
            canRedo: history.future.length > 0
        }}>
            {children}
        </ProjectContext.Provider>
    );
};
