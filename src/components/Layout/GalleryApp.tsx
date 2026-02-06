import React from 'react';
import { useProject } from '../../hooks/useProject';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileLayout } from './MobileLayout';
import { AppLayout, Header, LeftSidebar, MainCanvas, RightSidebar } from './AppLayout';
import FrameLibrary from '../Library/FrameLibrary';
import CanvasWorkspace from '../Canvas/CanvasWorkspace';
import PropertiesPanel from '../Properties/PropertiesPanel';
import GlobalActions from '../Header/GlobalActions';
import Logo from '../Header/Logo';
import ProjectMenu from '../Header/ProjectMenu';
import WindowControls from '../Header/WindowControls';
import LoadingOverlay from '../Common/LoadingOverlay';

// Moved Lazy Load imports here if they are only used in App?
// But actually WelcomeModal is used here.
const WelcomeModal = React.lazy(() => import('../Common/WelcomeModal'));

const GalleryApp: React.FC = () => {
    const { showWelcome, importDemoProject, startFresh, undo, redo, canUndo, canRedo, isProjectLoading } = useProject();
    const isMobile = useIsMobile();

    return (
        <>
            {isProjectLoading && (
                <LoadingOverlay message="Optimizing Project..." />
            )}
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

export default GalleryApp;
