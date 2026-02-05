import React, { createContext, useContext, useState, ReactNode } from 'react';
// import ProUpgradeDialog from '../components/Common/ProUpgradeDialog'; 
const ProUpgradeDialog = React.lazy(() => import('../components/Common/ProUpgradeDialog'));

interface ProContextType {
    showUpgradeModal: boolean;
    openProModal: () => void;
    closeProModal: () => void;
    isPro: boolean;
    isBeta: boolean;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

export const ProProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    
    // In the future, these would be dynamic
    const isPro = false; 
    const isBeta = true;

    const openProModal = () => setShowUpgradeModal(true);
    const closeProModal = () => setShowUpgradeModal(false);

    return (
        <ProContext.Provider value={{ showUpgradeModal, openProModal, closeProModal, isPro, isBeta }}>
            {children}
            {showUpgradeModal && (
                <React.Suspense fallback={null}>
                    <ProUpgradeDialog onClose={closeProModal} />
                </React.Suspense>
            )}
        </ProContext.Provider>
    );
};

export const useProModal = () => {
    const context = useContext(ProContext);
    if (context === undefined) {
        throw new Error('useProModal must be used within a ProProvider');
    }
    return context;
};
