import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

import { ProProvider } from './context/ProContext';
import LandingPage from './components/Landing/LandingPage';
import ScrollToTop from './components/Common/ScrollToTop';

// Lazy load the Main App & Contexts to avoid bloating the Landing Page
const EditorContextWrapper = React.lazy(() => import('./components/Layout/EditorContextWrapper'));
const GalleryApp = React.lazy(() => import('./components/Layout/GalleryApp'));

const HelpPage = React.lazy(() => import('./components/Help/HelpPage'));
const PrivacyPolicy = React.lazy(() => import('./components/Landing/PrivacyPolicy'));
const AboutPage = React.lazy(() => import('./components/Landing/AboutPage'));
const ChangelogPage = React.lazy(() => import('./components/Landing/ChangelogPage'));
const ResourcesHub = React.lazy(() => import('./components/Resources/ResourcesHub'));
const ArticleLayout = React.lazy(() => import('./components/Resources/ArticleLayout'));
const NotFound = React.lazy(() => import('./components/Common/NotFound'));

const App: React.FC = () => {
  React.useEffect(() => {
    const preventDefault = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);

    // Prime iOS Safari touch event system by adding a passive touchstart listener
    // This helps prevent the "first tap does nothing" issue on iOS Safari
    const touchPrimer = () => { };
    document.addEventListener('touchstart', touchPrimer, { passive: true });

    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
      document.removeEventListener('touchstart', touchPrimer);
    };
  }, []);

  return (
    <ErrorBoundary>
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
            <Route path="/learn" element={
              <React.Suspense fallback={null}>
                <ResourcesHub />
              </React.Suspense>
            } />
            <Route path="/learn/:slug" element={
              <React.Suspense fallback={null}>
                <ArticleLayout />
              </React.Suspense>
            } />
            <Route path="/app" element={
              <React.Suspense fallback={<div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
              }}>Loading App...</div>}>
                <EditorContextWrapper>
                  <GalleryApp />
                </EditorContextWrapper>
              </React.Suspense>
            } />
            {/* Fallback to NotFound */}
            <Route path="*" element={
              <React.Suspense fallback={null}>
                <NotFound />
              </React.Suspense>
            } />
          </Routes>
        </BrowserRouter>
      </ProProvider>
    </ErrorBoundary>
  );
};

export default App;
