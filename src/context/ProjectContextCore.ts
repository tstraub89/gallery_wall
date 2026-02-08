import { createContext } from 'react';
import { Project, Frame } from '../types';
import { SelectionContextType } from './SelectionContext';
import { ImageMetadata } from '../utils/imageStore';

export interface LibraryState {
    searchTerm: string;
    activeFilters: Record<string, boolean>;
    sortBy: string;
}

// Data-only interface
export interface ProjectDataContextType {
    projects: Record<string, Project>;
    currentProject: Project | null;
    currentProjectId: string | null;
    imagesMetadata: Record<string, ImageMetadata>;

    // Removed selection properties from Data Context
    // selectedFrameIds: string[]; ... etc

    isLoaded: boolean;
    isProjectLoading: boolean;
    showWelcome: boolean;

    // Actions
    addProject: (name: string) => string; // Returns new ID
    switchProject: (id: string) => void;
    setProjectLoading: (loading: boolean) => void;
    deleteProject: (id: string) => void;
    updateProject: (id: string, updates: Partial<Project>, skipHistory?: boolean) => void;

    addToLibrary: (projectId: string, frameDimensions: Partial<Frame>) => void;
    removeFromLibrary: (projectId: string, templateId: string) => void;
    addImageToLibrary: (projectId: string, imageId: string, metadata?: any) => void;
    applyTemplate: (projectId: string, templateId: string) => void;

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
    importGwall: (blob: Blob) => Promise<string>;
    startFresh: () => void;
}

// Combined type for legacy compatibility in useProject
export type ProjectContextType = ProjectDataContextType & SelectionContextType;

export const ProjectContext = createContext<ProjectDataContextType | undefined>(undefined);
