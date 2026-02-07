import React, { ReactNode } from 'react';
import { ProjectProvider } from '../../context/ProjectContext';
import { SelectionProvider } from '../../context/SelectionContext';
import { LayoutProvider } from '../../context/LayoutContext';

interface EditorContextWrapperProps {
    children: ReactNode;
}

const EditorContextWrapper: React.FC<EditorContextWrapperProps> = ({ children }) => {
    return (
        <ProjectProvider>
            <SelectionProvider>
                <LayoutProvider>
                    {children}
                </LayoutProvider>
            </SelectionProvider>
        </ProjectProvider>
    );
};

export default EditorContextWrapper;
