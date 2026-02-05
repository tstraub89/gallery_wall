import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { trackEvent, PRO_EVENTS } from '../utils/analytics';
import { UserProfile } from '../types';
import { v4 as uuidv4 } from 'uuid';

const ProUpgradeDialog = React.lazy(() => import('../components/Common/ProUpgradeDialog'));

interface ProContextType {
    showUpgradeModal: boolean;
    openProModal: () => void;
    closeProModal: () => void;
    isPro: boolean;
    isBeta: boolean;
    featuresUnlocked: boolean;
    userProfile: UserProfile | null;
    upgradeToPro: () => Promise<void>;
}

const STORAGE_KEY = 'gallery_planner_user_profile';

const ProContext = createContext<ProContextType | undefined>(undefined);

export const ProProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    
    // Load profile from storage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setUserProfile(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse user profile", e);
            }
        } else {
            // Initialize anonymous profile
            const newProfile: UserProfile = {
                id: uuidv4(),
                isPro: false,
                isBetaContributor: true, // Everyone in beta gets this flag
                subscriptionStatus: 'none',
            };
            setUserProfile(newProfile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
        }
    }, []);

    // In the future, these would be dynamic
    const isBeta = true;
    const isPro = userProfile?.isPro ?? false;
    const featuresUnlocked = isBeta || isPro;

    const openProModal = () => {
        trackEvent(PRO_EVENTS.OPEN_PRO_MODAL);
        setShowUpgradeModal(true);
    };
    
    const closeProModal = () => setShowUpgradeModal(false);

    const upgradeToPro = async () => {
        // This is where the payment gateway (Stripe etc) integration would happen
        console.log("Upgrading to Pro...");
        
        // Mocking successful upgrade
        if (userProfile) {
            const updatedProfile: UserProfile = {
                ...userProfile,
                isPro: true,
                subscriptionStatus: 'active',
                purchaseDate: Date.now()
            };
            setUserProfile(updatedProfile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
            trackEvent('pro_upgrade_success');
        }
    };

    return (
        <ProContext.Provider value={{ 
            showUpgradeModal, 
            openProModal, 
            closeProModal, 
            isPro, 
            isBeta, 
            featuresUnlocked,
            userProfile,
            upgradeToPro
        }}>
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
