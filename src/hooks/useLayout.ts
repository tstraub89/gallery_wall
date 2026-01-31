import { useContext } from 'react';
import { LayoutContext, LayoutContextType } from '../context/LayoutContextCore';

export const useLayout = (): LayoutContextType => {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
