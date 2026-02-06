import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import { LayoutProvider } from './context/LayoutContext';
import { ProProvider } from './context/ProContext';
import { AppLayout, Header, LeftSidebar, MainCanvas, RightSidebar } from './components/Layout/AppLayout';
import FrameLibrary from './components/Library/FrameLibrary';
import CanvasWorkspace from './components/Canvas/CanvasWorkspace';
import PropertiesPanel from './components/Properties/PropertiesPanel';
import GlobalActions from './components/Header/GlobalActions';
import Logo from './components/Header/Logo';
import ProjectMenu from './components/Header/ProjectMenu';
import WindowControls from './components/Header/WindowControls';
import LandingPage from './components/Landing/LandingPage';
// import WelcomeModal from './components/Common/WelcomeModal'; // Moved to lazy load
const WelcomeModal = React.lazy(() => import('./components/Common/WelcomeModal'));
const HelpPage = React.lazy(() => import('./components/Help/HelpPage'));
const PrivacyPolicy = React.lazy(() => import('./components/Landing/PrivacyPolicy'));
const AboutPage = React.lazy(() => import('./components/Landing/AboutPage'));
const ChangelogPage = React.lazy(() => import('./components/Landing/ChangelogPage'));
const NotFound = React.lazy(() => import('./components/Common/NotFound'));
import { useProject } from './hooks/useProject';

import { useIsMobile } from './hooks/useIsMobile';
import { MobileLayout } from './components/Layout/MobileLayout';
import ScrollToTop from './components/Common/ScrollToTop';

// Inner component that can use context
const AppTool: React.FC = () => {
  const { showWelcome, importDemoProject, startFresh, undo, redo, canUndo, canRedo } = useProject();
  const isMobile = useIsMobile();

  return (
    <>
      {showWelcome && (
        <React.Suspense fallback={null}>
          <WelcomeModal
            onLoadDemo={importDemoProject}
            onStartFresh={startFresh}
          />
        </React.Suspense>
      )}
      {isMobile ? (
        <MobileLayout
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        >
          {/* We reuse the same CanvasWorkspace! */}
          <CanvasWorkspace />
        </MobileLayout>
      ) : (
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
      )}
    </>
  );
};

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
        <ProProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/privacy" element={
                <React.Suspense fallback={null}>
                  <PrivacyPolicy />
                </React.Suspense>
              } />
              <Route path="/about" element={
                <React.Suspense fallback={null}>
                  <AboutPage />
                </React.Suspense>
              } />
              <Route path="/help" element={
                <React.Suspense fallback={null}>
                  <HelpPage />
                </React.Suspense>
              } />
              <Route path="/changelog" element={
                <React.Suspense fallback={null}>
                  <ChangelogPage />
                </React.Suspense>
              } />
              <Route path="/app" element={<AppTool />} />
              {/* Fallback to NotFound */}
              <Route path="*" element={
                <React.Suspense fallback={null}>
                  <NotFound />
                </React.Suspense>
              } />
            </Routes>
          </BrowserRouter>
        </ProProvider>
      </LayoutProvider>
    </ProjectProvider>
  );
};

export default App;

