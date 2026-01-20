import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ProjectContext = createContext();

const STORAGE_KEY = 'gallery_planner_data';

const initialData = {
    projects: {}, // { [id]: Project }
    currentProjectId: null,
    selectedFrameIds: [], // Array of frame IDs
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
});

export const ProjectProvider = ({ children }) => {
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : initialData;
    });

    // Auto-save to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [data]);

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

    // updateProject is now defined below with history logic
    // const updateProject = ... (removed)

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
        // frameDimensions: { width, height, matting: { ... } }
        const libraryItem = {
            id: uuidv4(),
            ...frameDimensions,
            count: 1, // How many of this specific frame type? Or just templates? 
            // Req: "Per-project frame inventory showing all available frames"
            // Req: "Frame counter showing used vs. available frames"
            // So we probably want "Inventory Items" vs "Placed Frames".
            // logic: User imports "5x7". We add 1 5x7 to inventory.
        };

        // For now, let's treat library as a list of distinct physical frames the user has.
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

    // --- Image Library Operations ---

    const addImageToLibrary = (projectId, imageId) => {
        setData(prev => {
            const project = prev.projects[projectId];
            if (!project) return prev;

            // Avoid duplicates
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

    // Safety: Ensure arrays exist even if localStorage has old data
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

    // --- History State ---
    const [history, setHistory] = useState({
        past: [],
        future: []
    });

    // Helper to push state to history
    // We only track PROJECT SPECIFIC changes, not global app state like currentProjectId?
    // Actually, if we undo a frame move, we need the previous state of that project.
    // So we push the COPY of the current project to past.

    const pushToHistory = (projectId) => {
        const currentMementro = data.projects[projectId];
        if (!currentMementro) return;

        setHistory(prev => ({
            past: [...prev.past, { projectId, data: JSON.parse(JSON.stringify(currentMementro)) }],
            future: [] // Clear future on new action
        }));
    };

    const undo = () => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;

            const newPast = [...prev.past];
            const previousState = newPast.pop();
            const { projectId, data: oldProjectData } = previousState;

            const currentProjectData = data.projects[projectId];

            // Push current to future
            const newFuture = [...prev.future, { projectId, data: JSON.parse(JSON.stringify(currentProjectData)) }];

            // Restore
            setData(d => ({
                ...d,
                projects: {
                    ...d.projects,
                    [projectId]: oldProjectData
                }
            }));

            return {
                past: newPast,
                future: newFuture
            };
        });
    };

    const redo = () => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev;

            const newFuture = [...prev.future];
            const nextState = newFuture.pop();
            const { projectId, data: nextProjectData } = nextState;

            const currentProjectData = data.projects[projectId];

            // Push current to past
            const newPast = [...prev.past, { projectId, data: JSON.parse(JSON.stringify(currentProjectData)) }];

            // Restore
            setData(d => ({
                ...d,
                projects: {
                    ...d.projects,
                    [projectId]: nextProjectData
                }
            }));

            return {
                past: newPast,
                future: newFuture
            };
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
                [id]: { ...prev.projects[id], ...updates, updatedAt: Date.now() } // Do not merge updates deep?
                // Logic: updateProject(id, { frames: newFrames })
                // We want to replace frames array, not merge.
                // Spread ...updates usually replaces keys. Correct.
            }
        }));
    };

    // ... existing delete/add logic ...
    // Note: deleteProject might need history? For now let's scope undo to "Project Modifications".

    // Expose undo/redo to context
    return (
        <ProjectContext.Provider value={{
            projects: data.projects,
            currentProject,
            currentProjectId: data.currentProjectId,
            selectedFrameIds: data.selectedFrameIds || [],
            addProject,
            switchProject,
            deleteProject,
            updateProject,
            addToLibrary,
            addImageToLibrary,
            selectFrame,
            setSelection,
            undo,
            redo,
            canUndo: history.past.length > 0,
            canRedo: history.future.length > 0
        }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => useContext(ProjectContext);
