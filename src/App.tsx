import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StaticRouter } from 'react-router';
import ErrorBoundary from './components/ErrorBoundary';

import { ProProvider } from './context/ProContext';
import { StaticDataProvider } from './context/StaticDataContext.tsx';
import LandingPage from './components/Landing/LandingPage';
import ScrollToTop from './components/Common/ScrollToTop';

// Lazy Load Pages
const HelpPage = React.lazy(() => import('./components/Help/HelpPage'));
const PrivacyPolicy = React.lazy(() => import('./components/Landing/PrivacyPolicy'));
const AboutPage = React.lazy(() => import('./components/Landing/AboutPage'));
const ChangelogPage = React.lazy(() => import('./components/Landing/ChangelogPage'));
const ResourcesHub = React.lazy(() => import('./components/Resources/ResourcesHub'));
const ArticleLayout = React.lazy(() => import('./components/Resources/ArticleLayout'));
const NotFound = React.lazy(() => import('./components/Common/NotFound'));

// Lazy load the Main App & Contexts
const EditorContextWrapper = React.lazy(() => import('./components/Layout/EditorContextWrapper'));
const GalleryApp = React.lazy(() => import('./components/Layout/GalleryApp'));

export const AppRoutes: React.FC = () => {
  return (
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
  );
};

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
        <StaticDataProvider value={{}}>
          <BrowserRouter>
            <ScrollToTop />
            <AppRoutes />
          </BrowserRouter>
        </StaticDataProvider>
      </ProProvider>
    </ErrorBoundary>
  );
};

export const StaticApp: React.FC<{ url: string; data?: { content?: string } }> = ({ url, data = {} }) => {
  return (
    <ErrorBoundary>
      <ProProvider>
        <StaticDataProvider value={data}>
          <StaticRouter location={url}>
            <AppRoutes />
          </StaticRouter>
        </StaticDataProvider>
      </ProProvider>
    </ErrorBoundary>
  );
};

export default App;
