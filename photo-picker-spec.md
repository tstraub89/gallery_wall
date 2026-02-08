# Smart Frame Filler - AI Photo Selection Specification
**Gallery Wall Planner Feature Specification**

**Version:** 1.0  
**Date:** February 7, 2026  
**Project:** Gallery Wall Planner ([gallery-planner.com](https://www.gallery-planner.com))  
**Repository:** [github.com/tstraub89/gallery_wall](https://github.com/tstraub89/gallery_wall)

---

## Executive Summary

This specification defines the "Smart Frame Filler" feature - an AI-assisted photo selection system that analyzes user photos and intelligently recommends optimal matches for frames in a gallery wall layout. The system operates entirely client-side for privacy, using local image analysis, heuristics, and lightweight neural networks.

---

## Feature Name

**Smart Frame Filler** (formerly "AI Photo Picker")

Alternative names considered:
- Frame Matcher
- Photo Curator
- Intelligent Gallery Assistant
- Frame-to-Photo AI

---

## Core Requirements

### 1. Privacy-First Architecture
- **100% client-side execution** - No photos leave the user's device
- No cloud API calls for image analysis
- No photo storage or transmission
- All processing in browser using WebAssembly and TensorFlow.js
- Clear privacy messaging in UI

### 2. Technical Stack Integration
- **Framework:** React with TypeScript (Vite)
- **Compatibility:** Desktop and mobile web apps
- **Libraries:**
  - TensorFlow.js with Blazeface model for face detection
  - Canvas API for image analysis
  - Browser File API for photo access
  - IndexedDB for local caching (optional performance enhancement)

---

## Feature Components

### A. Image Analysis Engine

#### 1. Color & Composition Analysis
**Objective:** Extract dominant colors, saturation, brightness for aesthetic matching

**Implementation:**
```typescript
interface ColorProfile {
  dominantColors: RGB[];      // Top 5 dominant colors
  averageColor: RGB;          // Overall average
  saturation: number;         // 0-100 scale
  brightness: number;         // 0-100 scale
  colorPalette: RGB[];        // Full palette (10-15 colors)
  colorHarmony: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted';
}
```

**Algorithm:**
- Use Canvas API to extract image data
- Implement median-cut color quantization for dominant color extraction
- Calculate HSV values for saturation/brightness
- Group similar colors to reduce palette complexity

**Libraries:**
- Custom color quantization algorithm (no external deps needed)
- Canvas `getImageData()` for pixel access

**Reference Implementation:**
```typescript
// Pseudo-code structure
const analyzeColors = async (imageFile: File): Promise<ColorProfile> => {
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');
  
  // Load and scale image for performance
  const img = await loadImage(imageFile);
  const scaleFactor = calculateOptimalScale(img);
  canvas.width = img.width * scaleFactor;
  canvas.height = img.height * scaleFactor;
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Extract color data
  const rgbValues = buildRgbArray(imageData);
  const palette = medianCutQuantization(rgbValues, depth: 4);
  
  return {
    dominantColors: palette.slice(0, 5),
    averageColor: calculateAverage(rgbValues),
    saturation: calculateSaturation(palette),
    brightness: calculateBrightness(palette),
    colorPalette: palette,
    colorHarmony: classifyColorHarmony(palette)
  };
};
```

#### 2. Face Detection
**Objective:** Identify photos with people for special handling

**Implementation:**
```typescript
interface FaceDetection {
  hasFaces: boolean;
  faceCount: number;
  faceBoundingBoxes: BoundingBox[];
  primaryFaceLocation: 'center' | 'left' | 'right' | 'top' | 'bottom';
  faceAreaPercentage: number; // % of image occupied by faces
  isPortrait: boolean;         // Single person portrait-style
  isGroup: boolean;            // Multiple people
}
```

**Model Selection:**
- **Primary:** TensorFlow.js Blazeface model
  - Lightweight (~1MB)
  - Fast inference (<100ms typical)
  - Good accuracy for face detection (not recognition)
  
**Alternative/Fallback:** face-api.js
  - More features (landmarks, expressions)
  - Slightly heavier but still browser-compatible

**Implementation Strategy:**
```typescript
import * as blazeface from '@tensorflow-models/blazeface';

const detectFaces = async (imageFile: File): Promise<FaceDetection> => {
  const model = await blazeface.load();
  const img = await loadImageElement(imageFile);
  
  const predictions = await model.estimateFaces(img, false);
  
  return {
    hasFaces: predictions.length > 0,
    faceCount: predictions.length,
    faceBoundingBoxes: predictions.map(p => ({
      topLeft: p.topLeft,
      bottomRight: p.bottomRight
    })),
    primaryFaceLocation: determineFaceLocation(predictions[0]),
    faceAreaPercentage: calculateFaceArea(predictions, img),
    isPortrait: predictions.length === 1 && checkPortraitComposition(predictions[0]),
    isGroup: predictions.length > 1
  };
};
```

#### 3. Aspect Ratio & Composition Analysis
**Objective:** Match photo composition to frame shape and size

**Implementation:**
```typescript
interface CompositionProfile {
  aspectRatio: number;          // width/height
  orientation: 'landscape' | 'portrait' | 'square';
  idealFrameRatios: number[];   // Compatible frame aspect ratios
  subjectLocation: 'center' | 'rule-of-thirds' | 'edge';
  hasVignetting: boolean;
  edgeSafety: EdgeSafety;       // How much can be cropped
}

interface EdgeSafety {
  top: number;     // % safe to crop (0-50)
  bottom: number;
  left: number;
  right: number;
}
```

**Frame Compatibility Matrix:**
```typescript
const FRAME_RATIOS = {
  '4x6': 1.5,      // Standard photo
  '5x7': 1.4,
  '8x10': 1.25,
  '11x14': 1.27,
  '16x20': 1.25,
  'square': 1.0,
  'circular': 1.0   // Special handling
};

// Tolerance for "close enough" matching
const RATIO_TOLERANCE = 0.1;
```

**Composition Detection:**
- Analyze edge gradients to detect important content near borders
- Use brightness/contrast to identify vignetting
- Detect rule-of-thirds composition using grid analysis
- Calculate safe crop zones using edge detection

#### 4. Resolution & Quality Analysis
**Objective:** Ensure photos have sufficient resolution for print quality

**Implementation:**
```typescript
interface ResolutionProfile {
  widthPx: number;
  heightPx: number;
  megapixels: number;
  estimatedDPI: number[];       // For various frame sizes
  printQuality: PrintQuality;
  recommendations: FrameSizeRecommendation[];
}

interface FrameSizeRecommendation {
  frameSize: string;            // e.g., "8x10"
  dpi: number;
  quality: 'excellent' | 'good' | 'acceptable' | 'poor';
  shouldUpscale: boolean;
}

const DPI_THRESHOLDS = {
  excellent: 300,
  good: 200,
  acceptable: 150,
  poor: 0
};
```

**DPI Calculation:**
```typescript
const calculateDPI = (
  imageWidth: number, 
  imageHeight: number, 
  frameWidthInches: number, 
  frameHeightInches: number
): number => {
  const orientation = imageWidth > imageHeight ? 'landscape' : 'portrait';
  
  // Match longest dimension
  const imageLongDimension = Math.max(imageWidth, imageHeight);
  const frameLongDimension = Math.max(frameWidthInches, frameHeightInches);
  
  return imageLongDimension / frameLongDimension;
};

const assessPrintQuality = (dpi: number): PrintQuality => {
  if (dpi >= 300) return 'excellent';
  if (dpi >= 200) return 'good';
  if (dpi >= 150) return 'acceptable';
  return 'poor';
};
```

**Frame Size Database:**
```typescript
const STANDARD_FRAME_SIZES = [
  { name: '4x6', width: 4, height: 6 },
  { name: '5x7', width: 5, height: 7 },
  { name: '8x10', width: 8, height: 10 },
  { name: '11x14', width: 11, height: 14 },
  { name: '16x20', width: 16, height: 20 },
  { name: '8x8', width: 8, height: 8 },
  // etc.
];
```

#### 5. Circular Frame Handling
**Objective:** Preview and optimize photos for circular frames

**Implementation:**
```typescript
interface CircularFrameAnalysis {
  centerPoint: Point;           // Optimal center for circular crop
  safeRadius: number;           // Max radius without critical content loss
  subjectCentered: boolean;
  cropPreview: ImageData;       // Circular preview
  contentLoss: number;          // % of image outside circle (0-100)
}
```

**Circular Cropping Algorithm:**
```typescript
const analyzeCircularCrop = async (
  imageFile: File,
  frameDiameter: number
): Promise<CircularFrameAnalysis> => {
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');
  const img = await loadImage(imageFile);
  
  // Find optimal center using center-of-mass or face location
  const centerPoint = faceDetection.hasFaces 
    ? calculateFaceCenter(faceDetection)
    : calculateCenterOfMass(img);
  
  // Calculate safe radius
  const safeRadius = Math.min(
    img.width / 2,
    img.height / 2,
    distanceToNearestEdge(centerPoint, img)
  );
  
  // Generate preview with circular mask
  const preview = generateCircularPreview(img, centerPoint, safeRadius);
  
  return {
    centerPoint,
    safeRadius,
    subjectCentered: isSubjectCentered(centerPoint, img),
    cropPreview: preview,
    contentLoss: calculateContentLoss(img, centerPoint, safeRadius)
  };
};
```

### B. Matching Algorithm

#### 1. Frame-to-Photo Scoring System
**Objective:** Score how well each photo fits each frame

```typescript
interface MatchScore {
  photoId: string;
  frameId: string;
  totalScore: number;           // 0-100
  breakdown: ScoreBreakdown;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

interface ScoreBreakdown {
  aspectRatioMatch: number;     // 0-25 points
  resolutionQuality: number;    // 0-25 points
  compositionFit: number;       // 0-20 points
  colorHarmony: number;         // 0-15 points
  faceHandling: number;         // 0-15 points
}
```

**Scoring Functions:**

```typescript
// 1. Aspect Ratio Match (0-25 points)
const scoreAspectRatio = (photoRatio: number, frameRatio: number): number => {
  const diff = Math.abs(photoRatio - frameRatio);
  
  if (diff < 0.05) return 25;      // Perfect match
  if (diff < 0.10) return 22;      // Excellent
  if (diff < 0.15) return 18;      // Good
  if (diff < 0.25) return 12;      // Acceptable
  if (diff < 0.40) return 6;       // Poor
  return 0;                         // Very poor
};

// 2. Resolution Quality (0-25 points)
const scoreResolution = (dpi: number, frameSize: string): number => {
  // Smaller frames more forgiving on resolution
  const isSmallFrame = SMALL_FRAMES.includes(frameSize);
  const thresholdMultiplier = isSmallFrame ? 0.8 : 1.0;
  
  const adjustedDPI = dpi / thresholdMultiplier;
  
  if (adjustedDPI >= 300) return 25;
  if (adjustedDPI >= 240) return 22;
  if (adjustedDPI >= 200) return 18;
  if (adjustedDPI >= 150) return 12;
  if (adjustedDPI >= 100) return 6;
  return 0;
};

// 3. Composition Fit (0-20 points)
const scoreComposition = (
  photo: CompositionProfile,
  frame: Frame
): number => {
  let score = 10; // Base score
  
  // Portrait photos in portrait frames (and vice versa)
  if (photo.orientation === frame.orientation) {
    score += 5;
  }
  
  // Safe cropping zones
  const cropRequired = calculateRequiredCrop(photo, frame);
  if (cropRequired < 5) score += 5;      // Minimal crop
  else if (cropRequired < 15) score += 3; // Some crop
  else if (cropRequired < 30) score += 1; // Significant crop
  
  return score;
};

// 4. Color Harmony (0-15 points)
const scoreColorHarmony = (
  photo: ColorProfile,
  adjacentPhotos: ColorProfile[]
): number => {
  if (adjacentPhotos.length === 0) return 15; // No constraints
  
  let score = 0;
  
  // Check color diversity
  const colorDiversity = calculateColorDiversity(
    photo.dominantColors,
    adjacentPhotos.flatMap(p => p.dominantColors)
  );
  
  if (colorDiversity > 0.7) score += 8;      // Very different
  else if (colorDiversity > 0.4) score += 6;  // Somewhat different
  else if (colorDiversity > 0.2) score += 3;  // Similar
  
  // Saturation balance
  const saturationBalance = balanceSaturation(
    photo.saturation,
    adjacentPhotos.map(p => p.saturation)
  );
  score += saturationBalance * 7;
  
  return score;
};

// 5. Face Handling (0-15 points)
const scoreFaceHandling = (
  photo: FaceDetection,
  frame: Frame
): number => {
  if (!photo.hasFaces) return 15; // No constraints
  
  let score = 0;
  
  // Faces centered in frame
  if (photo.primaryFaceLocation === 'center') {
    score += 8;
  } else {
    score += 4;
  }
  
  // Portrait photos should be in appropriate frames
  if (photo.isPortrait && frame.orientation === 'portrait') {
    score += 7;
  } else if (photo.isGroup && frame.orientation === 'landscape') {
    score += 7;
  } else {
    score += 3;
  }
  
  return score;
};
```

#### 2. Global Optimization
**Objective:** Optimize entire gallery for cohesion, not just individual matches

```typescript
interface GalleryOptimization {
  assignments: Map<string, string>; // frameId -> photoId
  globalScore: number;
  colorBalance: number;
  subjectDiversity: number;
  orientationBalance: number;
}

const optimizeGallery = (
  frames: Frame[],
  photos: Photo[],
  analyses: Map<string, PhotoAnalysis>
): GalleryOptimization => {
  // Use greedy algorithm with backtracking
  // 1. Score all possible frame-photo pairs
  // 2. Assign highest scoring pairs first
  // 3. Re-evaluate remaining pairs considering assigned context
  // 4. Use simulated annealing for final optimization
  
  const assignments = new Map();
  const usedPhotos = new Set();
  
  // Initial greedy assignment
  for (const frame of sortByImportance(frames)) {
    const candidates = photos
      .filter(p => !usedPhotos.has(p.id))
      .map(p => ({
        photo: p,
        score: calculateMatchScore(
          frame, 
          p, 
          analyses.get(p.id),
          getAdjacentFrames(frame, assignments)
        )
      }))
      .sort((a, b) => b.score.totalScore - a.score.totalScore);
    
    if (candidates.length > 0) {
      const best = candidates[0];
      assignments.set(frame.id, best.photo.id);
      usedPhotos.add(best.photo.id);
    }
  }
  
  // Optimization pass: swap pairs to improve global score
  optimizeSwaps(assignments, frames, photos, analyses);
  
  return {
    assignments,
    globalScore: calculateGlobalScore(assignments, frames, photos, analyses),
    colorBalance: assessColorBalance(assignments, analyses),
    subjectDiversity: assessSubjectDiversity(assignments, analyses),
    orientationBalance: assessOrientationBalance(assignments, frames)
  };
};
```

**Gallery-Level Heuristics:**
- **Color distribution:** Avoid clustering similar colors
- **Subject diversity:** Mix portraits, landscapes, abstracts
- **Orientation balance:** Don't over-weight one orientation
- **Visual weight:** Distribute dark/light images evenly
- **Face distribution:** Space out photos with faces

### C. User Interface Components

#### 1. Photo Library Import
```typescript
interface PhotoLibraryUI {
  // Multiple import methods
  importFromFiles: () => Promise<File[]>;
  importFromFolder: () => Promise<File[]>;  // Chrome only
  dragAndDrop: boolean;
}
```

**Features:**
- Batch upload support
- Folder selection (Chrome File System Access API)
- Drag-and-drop interface
- Progress indication for analysis
- Thumbnail generation

#### 2. Smart Suggestions Panel
```typescript
interface SuggestionsPanel {
  mode: 'auto' | 'manual' | 'hybrid';
  suggestions: FrameSuggestion[];
  filters: FilterOptions;
}

interface FrameSuggestion {
  frameId: string;
  photoId: string;
  matchScore: MatchScore;
  preview: string;              // Data URL
  alternativeMatches: string[]; // Other photo IDs
}
```

**UI Elements:**
- Frame-by-frame suggestions with thumbnails
- Match score visualization (e.g., 5-star rating)
- "Accept All" vs "Review Individually"
- Manual override controls
- Alternative photo suggestions per frame

#### 3. Preview System
```typescript
interface PreviewMode {
  showCropGuides: boolean;
  showResolutionWarnings: boolean;
  compareBeforeAfter: boolean;
  highlightFaces: boolean;
}
```

**Features:**
- Live preview of photo in frame with actual cropping
- Circular frame preview with proper masking
- Resolution warning badges
- Zoom and pan controls
- Side-by-side comparison mode

#### 4. Batch Actions
```typescript
interface BatchActions {
  acceptAllSuggestions: () => void;
  autoFillEmpty: () => void;
  optimizeCurrentLayout: () => void;
  shufflePhotos: () => void;
  resetAll: () => void;
}
```

#### 5. Filters & Preferences
```typescript
interface UserPreferences {
  // Priority weights
  prioritizeResolution: boolean;
  prioritizeFaces: boolean;
  allowCropping: boolean;
  
  // Quality thresholds
  minDPI: number;
  minMatchScore: number;
  
  // Style preferences
  colorScheme: 'balanced' | 'monochrome' | 'vibrant' | 'any';
  photoStyle: 'portraits' | 'landscapes' | 'mixed';
}
```

### D. Performance Optimization

#### 1. Progressive Analysis
```typescript
interface AnalysisQueue {
  priority: Photo[];        // User-selected or visible frames
  background: Photo[];      // Rest of library
  
  processNext: () => Promise<void>;
  pauseAnalysis: () => void;
  resumeAnalysis: () => void;
}
```

**Strategy:**
- Analyze photos on-demand as frames are added
- Background processing for remaining library
- Web Worker for parallel analysis
- Caching results in IndexedDB

#### 2. Lazy Loading
- Load models only when feature is activated
- Defer face detection until needed (toggle feature)
- Progressive image loading for large libraries

#### 3. Optimization Techniques
```typescript
// Scale down images for analysis (faster processing)
const ANALYSIS_MAX_DIMENSION = 800; // pixels

// Use thumbnail generation
const generateThumbnail = async (file: File): Promise<Blob> => {
  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');
  const img = await loadImage(file);
  
  const scale = Math.min(
    ANALYSIS_MAX_DIMENSION / img.width,
    ANALYSIS_MAX_DIMENSION / img.height,
    1 // Don't upscale
  );
  
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvasToBlob(canvas);
};
```

---

## Additional Features

### 1. Smart Grouping
**Objective:** Suggest which photos work well together

```typescript
interface PhotoGrouping {
  groups: PhotoGroup[];
  theme: string;
  cohesion: number;
}

interface PhotoGroup {
  photos: string[];        // Photo IDs
  commonality: 'color' | 'subject' | 'style' | 'time';
  strength: number;
}
```

**Grouping Heuristics:**
- Similar color palettes
- Similar subjects (all landscapes, all portraits)
- EXIF metadata (same day, same location)
- Visual similarity

### 2. Style Detection
**Objective:** Identify photo style for better matching

```typescript
enum PhotoStyle {
  Portrait,
  Landscape,
  Macro,
  Abstract,
  BlackAndWhite,
  Vintage,
  Modern,
  Architectural
}

const detectStyle = (analysis: PhotoAnalysis): PhotoStyle[] => {
  const styles: PhotoStyle[] = [];
  
  // Black and white detection
  if (isGrayscale(analysis.colorProfile)) {
    styles.push(PhotoStyle.BlackAndWhite);
  }
  
  // Portrait detection
  if (analysis.faceDetection.isPortrait) {
    styles.push(PhotoStyle.Portrait);
  }
  
  // Landscape detection
  if (analysis.orientation === 'landscape' && !analysis.faceDetection.hasFaces) {
    styles.push(PhotoStyle.Landscape);
  }
  
  // Additional style detection logic...
  
  return styles;
};
```

### 3. EXIF Metadata Extraction
**Objective:** Use photo metadata for additional context

```typescript
interface PhotoMetadata {
  dateTaken: Date;
  location?: GeoLocation;
  camera?: string;
  lens?: string;
  focalLength?: number;
  iso?: number;
  aperture?: number;
}
```

**Library:** `exif-js` or native browser support where available

### 4. Duplicate Detection
**Objective:** Identify similar/duplicate photos

```typescript
interface DuplicateDetection {
  isDuplicate: boolean;
  similarPhotos: string[];     // Photo IDs
  similarity: number;          // 0-1
}

const detectDuplicates = (
  photo: Photo,
  library: Photo[],
  analyses: Map<string, PhotoAnalysis>
): DuplicateDetection => {
  // Use perceptual hashing (pHash)
  const photoHash = generatePerceptualHash(photo);
  
  const similar = library
    .filter(p => p.id !== photo.id)
    .map(p => ({
      id: p.id,
      similarity: compareHashes(photoHash, generatePerceptualHash(p))
    }))
    .filter(s => s.similarity > 0.9)
    .map(s => s.id);
  
  return {
    isDuplicate: similar.length > 0,
    similarPhotos: similar,
    similarity: Math.max(...similar.map(id => 
      compareHashes(photoHash, generatePerceptualHash(library.find(p => p.id === id)))
    ))
  };
};
```

### 5. Export & Sharing
```typescript
interface ExportOptions {
  includeRecommendations: boolean;
  exportFormat: 'json' | 'csv';
  includeAnalysisData: boolean;
}
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Set up TypeScript interfaces and types
- [ ] Implement color analysis using Canvas API
- [ ] Create basic aspect ratio matching
- [ ] Build simple UI for photo upload
- [ ] Thumbnail generation

### Phase 2: AI Integration (Week 3-4)
- [ ] Integrate TensorFlow.js and Blazeface model
- [ ] Implement face detection pipeline
- [ ] Add resolution/DPI calculation
- [ ] Build composition analysis

### Phase 3: Matching Algorithm (Week 5-6)
- [ ] Implement frame-to-photo scoring
- [ ] Build global optimization algorithm
- [ ] Add circular frame handling
- [ ] Create suggestion ranking system

### Phase 4: UI/UX (Week 7-8)
- [ ] Design and build suggestions panel
- [ ] Implement preview system with cropping
- [ ] Add batch actions
- [ ] Create filters and preferences UI

### Phase 5: Optimization (Week 9-10)
- [ ] Add Web Worker for background processing
- [ ] Implement progressive analysis
- [ ] Add IndexedDB caching
- [ ] Performance profiling and optimization

### Phase 6: Polish (Week 11-12)
- [ ] Additional features (grouping, style detection)
- [ ] EXIF metadata integration
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] User onboarding flow

---

## Technical Dependencies

```json
{
  "dependencies": {
    "@tensorflow/tfjs": "^4.18.0",
    "@tensorflow-models/blazeface": "^2.1.0",
    "exif-js": "^2.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0"
  }
}
```

**Estimated Bundle Size Impact:**
- TensorFlow.js: ~500KB (gzipped)
- Blazeface model: ~1MB
- Custom analysis code: ~50KB
- Total: ~1.5MB additional (lazy-loaded)

---

## API Design

### Main Service Class

```typescript
class SmartFrameFiller {
  private model: blazeface.BlazeFaceModel | null = null;
  private analysisCache: Map<string, PhotoAnalysis> = new Map();
  private worker: Worker | null = null;
  
  constructor(private config: SmartFrameFillerConfig) {}
  
  // Initialization
  async initialize(): Promise<void>;
  async loadModels(): Promise<void>;
  
  // Photo analysis
  async analyzePhoto(file: File): Promise<PhotoAnalysis>;
  async analyzePhotoLibrary(files: File[]): Promise<Map<string, PhotoAnalysis>>;
  
  // Matching
  async suggestMatches(
    frames: Frame[], 
    photos: Photo[]
  ): Promise<FrameSuggestion[]>;
  
  async optimizeGallery(
    frames: Frame[], 
    photos: Photo[]
  ): Promise<GalleryOptimization>;
  
  // Preview
  async generatePreview(
    photoId: string, 
    frameId: string
  ): Promise<string>;
  
  // Utilities
  clearCache(): void;
  exportAnalysis(): ExportData;
  importAnalysis(data: ExportData): void;
}
```

### React Integration

```typescript
// Custom Hook
function useSmartFrameFiller(config?: Partial<SmartFrameFillerConfig>) {
  const [isReady, setIsReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  const service = useRef<SmartFrameFiller>();
  
  useEffect(() => {
    service.current = new SmartFrameFiller(config);
    service.current.initialize()
      .then(() => setIsReady(true))
      .catch(setError);
  }, []);
  
  const analyzePhotos = async (files: File[]) => {
    setIsAnalyzing(true);
    try {
      const results = await service.current!.analyzePhotoLibrary(files);
      return results;
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const suggestMatches = async (frames: Frame[], photos: Photo[]) => {
    return service.current!.suggestMatches(frames, photos);
  };
  
  return {
    isReady,
    isAnalyzing,
    progress,
    error,
    analyzePhotos,
    suggestMatches
  };
}
```

---

## Testing Strategy

### Unit Tests
- Color analysis accuracy
- Aspect ratio matching
- DPI calculations
- Scoring functions

### Integration Tests
- End-to-end photo analysis
- Matching algorithm correctness
- Gallery optimization

### Performance Tests
- Analysis time for various image sizes
- Memory usage with large libraries
- Model loading time

### Browser Compatibility Tests
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)
- WebAssembly and WebGL support detection

---

## Privacy & Security Considerations

1. **No Data Transmission**
   - All processing client-side
   - No analytics on photos
   - No cloud uploads

2. **Clear Communication**
   - Privacy notice in UI
   - "Your photos never leave your device" messaging
   - Explain local processing

3. **Permissions**
   - Request file access only when needed
   - Clear explanation of why permissions needed

4. **Data Cleanup**
   - Clear cache on session end (optional)
   - Don't persist analyzed data unless user opts in

---

## Future Enhancements

### V2 Features (Post-MVP)
- **Advanced face recognition** (opt-in): Group photos by person
- **Semantic understanding**: Use CLIP model for content understanding
- **Print order integration**: Direct print ordering with recommendations
- **AR preview**: See gallery on actual wall using AR
- **Style transfer**: Apply consistent filters across gallery
- **Collaborative galleries**: Share and get feedback
- **Custom ML models**: Train on user's own gallery preferences

### Research Areas
- **Image quality assessment**: Detect blur, noise, compression artifacts
- **Aesthetic scoring**: ML model trained on aesthetic preferences
- **Emotion detection**: Match photo emotion to room mood
- **Scene detection**: Advanced semantic understanding (beach, mountains, etc.)

---

## Success Metrics

### Primary KPIs
- **Adoption rate**: % of users who try Smart Frame Filler
- **Completion rate**: % who accept suggestions
- **Time savings**: Reduction in time to fill gallery
- **User satisfaction**: Survey scores

### Technical Metrics
- **Analysis time**: <2s per photo average
- **Accuracy**: >80% user acceptance of suggestions
- **Performance**: <3s to generate full gallery suggestions
- **Bundle size**: <2MB additional (lazy-loaded)

---

## Open Questions for Product Team

1. Should face detection be always-on or opt-in feature?
2. What level of user control vs automation is desired?
3. Should we support RAW image formats?
4. Integration with cloud photo services (Google Photos, iCloud)?
5. Offline-first vs online-first architecture?

---

## Glossary

- **Aspect Ratio**: Width-to-height ratio of image or frame
- **DPI/PPI**: Dots/Pixels Per Inch - resolution measurement for printing
- **Blazeface**: Lightweight face detection model by Google
- **Canvas API**: Browser API for image manipulation
- **Perceptual Hash**: Algorithm to create image fingerprint for similarity detection
- **Color Quantization**: Reducing color palette to dominant colors
- **Median-Cut**: Algorithm for color quantization
- **TensorFlow.js**: JavaScript library for machine learning in browser

---

## References & Resources

1. [TensorFlow.js Documentation](https://www.tensorflow.org/js)
2. [Blazeface Model](https://github.com/tensorflow/tfjs-models/tree/master/blazeface)
3. [Canvas API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
4. [Color Quantization Algorithms](https://en.wikipedia.org/wiki/Median_cut)
5. [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
6. [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)

---

**Document Status:** Draft v1.0  
**Last Updated:** February 7, 2026  
**Next Review:** Post Phase 1 implementation