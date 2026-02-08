import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { PostHogProvider } from 'posthog-js/react'

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  ui_host: 'https://us.posthog.com',
  person_profiles: 'identified_only',
} as const

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
      <ErrorBoundary>
        <App />
        <SpeedInsights />
      </ErrorBoundary>
    </PostHogProvider>
  </React.StrictMode>,
)
