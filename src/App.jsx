import React from 'react';
import { ProjectProvider } from './context/ProjectContext';
import { AppLayout, Header, LeftSidebar, MainCanvas, RightSidebar } from './components/Layout/AppLayout';
import FrameLibrary from './components/Library/FrameLibrary';
import CanvasWorkspace from './components/Canvas/CanvasWorkspace';
import PropertiesPanel from './components/Properties/PropertiesPanel';
import ProjectMenu from './components/Header/ProjectMenu';
import GlobalActions from './components/Header/GlobalActions';

import Logo from './components/Header/Logo';

function App() {
  React.useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  return (
    <ProjectProvider>
      <AppLayout>
        <Header>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <ProjectMenu />
            <GlobalActions />
          </div>
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
    </ProjectProvider>
  );
}

export default App;
