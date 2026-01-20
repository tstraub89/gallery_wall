import React from 'react';
import { ProjectProvider } from './context/ProjectContext';
import { AppLayout, Header, LeftSidebar, MainCanvas, RightSidebar } from './components/Layout/AppLayout';
import FrameLibrary from './components/Library/FrameLibrary';
import CanvasWorkspace from './components/Canvas/CanvasWorkspace';
import PropertiesPanel from './components/Properties/PropertiesPanel';
import ProjectMenu from './components/Header/ProjectMenu';
import GlobalActions from './components/Header/GlobalActions';

function App() {
  return (
    <ProjectProvider>
      <AppLayout>
        <Header>
          <h1>Gallery Planner</h1>
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
