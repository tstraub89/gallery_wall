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

const WelcomeModal = React.lazy(() => import('../Common/WelcomeModal'));

const VDivider = () => <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)', margin: '0 8px' }} />;

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
                        <VDivider />

                        {/* Main Actions Cluster */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ProjectMenu />
                            <GlobalActions />
                        </div>

                        <div style={{ flex: 1 }} />

                        {/* PRO BUTTON */}
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
