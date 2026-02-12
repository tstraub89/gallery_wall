import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StaticRouter } from 'react-router';
import ErrorBoundary from './components/ErrorBoundary';

import { ProProvider } from './context/ProContext';
import { StaticDataProvider } from './context/StaticDataContext.tsx';
import LandingPage from './components/Landing/LandingPage';
import ScrollToTop from './components/Common/ScrollToTop';

import HelpPage from './components/Help/HelpPage';
import PrivacyPolicy from './components/Landing/PrivacyPolicy';
import AboutPage from './components/Landing/AboutPage';
import ChangelogPage from './components/Landing/ChangelogPage';
import ResourcesHub from './components/Resources/ResourcesHub';
import ArticleLayout from './components/Resources/ArticleLayout';
import NotFound from './components/Common/NotFound';

// Lazy load the Main App & Contexts to avoid bloating the Landing Page
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
