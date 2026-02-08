export interface ImageState {
    scale: number;
    x: number;
    y: number;
    rotation: number;
}

export interface TemplateFrame {
    width: number;
    height: number;
    x: number;
    y: number;
    label?: string;
    rotation?: number;
    borderWidth?: number;
    frameColor?: string;
    matted?: MatDimensions | null;
    shape?: string;
}

export interface Template {
    id: string;
    name: string;
    category: string;
    description: string;
    frames: TemplateFrame[];
}

export interface MatDimensions {
    width: number;
    height: number;
}

export interface Frame {
    id: string;
    width: number;
    height: number;
    x: number;
    y: number;
    rotation: number;
    zIndex: number;
    imageId?: string | null;
    imageState?: ImageState | null;
    borderWidth?: number;
    frameColor?: string;
    matted?: MatDimensions | null;
    templateId?: string;
    // Library properties
    label?: string;
    shape?: 'rect' | 'round' | string;
    isDuplicate?: boolean;
    createdAt?: number;
    locked?: boolean;
}

export interface WallConfig {
    width: number;
    height: number;
    backgroundColor: string;
    type: string;
    stairAngle?: number; // degrees, 15-60, default 30
}

export interface LibraryItem extends Frame {
    count: number;
    createdAt?: number;
}

export interface Project {
    id: string;
    name: string;
    frames: Frame[];
    wallConfig: WallConfig;
    images: string[];
    library: LibraryItem[];
    createdAt?: number;
    updatedAt?: number;
    version?: number;
    activeTemplateId?: string | null;
    isDemo?: boolean;
}

export interface UserProfile {
    id: string;
    email?: string;
    isPro: boolean;
    isBetaContributor: boolean;
    subscriptionStatus: 'active' | 'inactive' | 'trial' | 'none';
    purchaseDate?: number;
    expiryDate?: number;
    lastSyncedAt?: number;
}
