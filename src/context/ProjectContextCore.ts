import { createContext } from 'react';
import { Project, Frame } from '../types';

export interface LibraryState {
    searchTerm: string;
    activeFilters: Record<string, boolean>;
    sortBy: string;
}

export interface ProjectContextType {
    projects: Record<string, Project>;
    currentProject: Project | null;
    currentProjectId: string | null;
    selectedFrameIds: string[];
    selectedImageIds: string[];
    focusedArea: 'canvas' | 'library' | null;
    isLoaded: boolean;
    showWelcome: boolean;

    // Actions
    addProject: (name: string) => string; // Returns new ID
    switchProject: (id: string) => void;
    deleteProject: (id: string) => void;
    updateProject: (id: string, updates: Partial<Project>, skipHistory?: boolean) => void;

    addToLibrary: (projectId: string, frameDimensions: Partial<Frame>) => void;
    removeFromLibrary: (projectId: string, templateId: string) => void;
    addImageToLibrary: (projectId: string, imageId: string) => void;

    selectFrame: (frameId: string, multi?: boolean) => void;
    setSelection: (ids: string[]) => void;
    setSelectedImages: (ids: string[]) => void;
    setFocusedArea: (area: 'canvas' | 'library' | null) => void;

    libraryState: LibraryState;
    frameState: LibraryState;
    updateLibraryState: (updates: Partial<LibraryState>) => void;
    updateFrameState: (updates: Partial<LibraryState>) => void;

    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;

    // Onboarding
    importDemoProject: () => Promise<void>;
    startFresh: () => void;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);
