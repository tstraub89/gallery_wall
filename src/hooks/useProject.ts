import { useContext } from 'react';
import { ProjectContext } from '../context/ProjectContextCore';
import { useSelection } from '../context/SelectionContext';
import { ProjectContextType } from '../context/ProjectContextCore';

export const useProject = (): ProjectContextType => {
    const projectContext = useContext(ProjectContext);
    const selectionContext = useSelection();

    if (projectContext === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }

    // Merge the contexts to maintain the original API
    return {
        ...projectContext,
        ...selectionContext
    };
};
