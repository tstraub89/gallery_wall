import React from 'react';
import { ProjectProvider } from './context/ProjectContext';
import { LayoutProvider } from './context/LayoutContext';
import { AppLayout, Header, LeftSidebar, MainCanvas, RightSidebar } from './components/Layout/AppLayout';
import FrameLibrary from './components/Library/FrameLibrary';
import CanvasWorkspace from './components/Canvas/CanvasWorkspace';
import PropertiesPanel from './components/Properties/PropertiesPanel';
import GlobalActions from './components/Header/GlobalActions';
import Logo from './components/Header/Logo';
import ProjectMenu from './components/Header/ProjectMenu';
import WindowControls from './components/Header/WindowControls';

const App: React.FC = () => {
  React.useEffect(() => {
    const preventDefault = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  return (
    <ProjectProvider>
      <LayoutProvider>
        <AppLayout>
          <Header>
            <Logo />
            {/* Project Selector - LEFT */}
            <ProjectMenu />
            {/* Project/Export Actions - LEFT */}
            <GlobalActions />
            <div style={{ flex: 1 }} />
            {/* Github/Help/Collapse - RIGHT */}
            <WindowControls />
          </Header>
          <LeftSidebar>
            <FrameLibrary />
          </LeftSidebar>
          <MainCanvas>
            <CanvasWorkspace />
          </MainCanvas>
          <RightSidebar>
            <PropertiesPanel />
          </RightSidebar>
        </AppLayout>
      </LayoutProvider>
    </ProjectProvider>
  );
};

export default App;
