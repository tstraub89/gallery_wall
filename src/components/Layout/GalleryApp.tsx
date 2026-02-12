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
import FeedbackToast from '../Common/FeedbackToast';

const WelcomeModal = React.lazy(() => import('../Common/WelcomeModal'));

const FEEDBACK_STORAGE_KEY = 'gallery_planner_feedback_shown';
const SESSION_START_KEY = 'gallery_planner_session_start';
const FEEDBACK_TRIGGER_TIME = 10 * 60 * 1000; // 10 minutes (passive)
const FEEDBACK_ACTIVE_TIME = 2 * 60 * 1000; // 2 minutes (active)
const FEEDBACK_TRIGGER_FRAMES = 5;

const VDivider = () => <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)', margin: '0 8px' }} />;

const GalleryApp: React.FC = () => {
    const {
        showWelcome,
        importDemoProject,
        startFresh,
        undo,
        redo,
        canUndo,
        canRedo,
        isProjectLoading,
        currentProject
    } = useProject();
    const isMobile = useIsMobile();
    const framesCount = currentProject?.frames?.length || 0;
    const [showFeedback, setShowFeedback] = React.useState(false);
    const initialFramesCount = React.useRef<number | null>(null);

    React.useEffect(() => {
        // Initialize initialFramesCount once the project is loaded
        if (!isProjectLoading && currentProject && initialFramesCount.current === null) {
            initialFramesCount.current = framesCount;
        }
    }, [isProjectLoading, currentProject, framesCount]);

    React.useEffect(() => {
        // Check if feedback already shown
        const feedbackShown = localStorage.getItem(FEEDBACK_STORAGE_KEY);
        if (feedbackShown) return;

        // Session time trigger
        let sessionStart = sessionStorage.getItem(SESSION_START_KEY);
        if (!sessionStart) {
            sessionStart = Date.now().toString();
            sessionStorage.setItem(SESSION_START_KEY, sessionStart);
        }

        const checkTrigger = () => {
            if (initialFramesCount.current === null) return false;

            const now = Date.now();
            const elapsed = now - parseInt(sessionStart!);
            const framesAdded = framesCount - initialFramesCount.current;

            // 1. Long session (10 mins)
            if (elapsed > FEEDBACK_TRIGGER_TIME) {
                setShowFeedback(true);
                return true;
            }

            // 2. Active usage (2 mins + 5 frames added)
            if (elapsed > FEEDBACK_ACTIVE_TIME && framesAdded >= FEEDBACK_TRIGGER_FRAMES) {
                setShowFeedback(true);
                return true;
            }

            return false;
        };

        // Check initially
        if (checkTrigger()) return;

        // Check every 30s
        const interval = setInterval(() => {
            if (checkTrigger()) {
                clearInterval(interval);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [framesCount, isProjectLoading]);

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
            {showFeedback && (
                <FeedbackToast onClose={() => setShowFeedback(false)} />
            )}
        </>
    );
};

export default GalleryApp;
