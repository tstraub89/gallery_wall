import { useContext } from 'react';
import { ProjectContext, ProjectContextType } from '../context/ProjectContextCore';

export const useProject = (): ProjectContextType => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
