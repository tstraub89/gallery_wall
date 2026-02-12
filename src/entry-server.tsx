import { renderToString } from 'react-dom/server';
import { StaticApp } from './App.tsx';
import { ProProvider } from './context/ProContext';
import ErrorBoundary from './components/ErrorBoundary';

export function render(url: string, data?: { content?: string }) {
    return renderToString(
        <ErrorBoundary>
            <ProProvider>
                <StaticApp url={url} data={data} />
            </ProProvider>
        </ErrorBoundary>
    );
}
