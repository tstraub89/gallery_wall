# Smart Frame Filler - Caching & Web Worker Architecture

## Supplement to Main Specification Document

---

## Caching Strategy

### IndexedDB Schema

**Database Name:** `gallery-planner-cache`  
**Version:** 1

#### Object Stores

##### 1. `photoAnalysis`
**Purpose:** Store computed analysis results to avoid re-processing

```typescript
interface PhotoAnalysisCache {
  id: string;                    // Photo file hash or unique ID
  timestamp: number;             // When analyzed
  fileSize: number;              // Original file size (for validation)
  analysis: {
    colorProfile: ColorProfile;
    faceDetection: FaceDetection;
    compositionProfile: CompositionProfile;
    resolutionProfile: ResolutionProfile;
    circularFrameAnalysis?: CircularFrameAnalysis;
  };
}

// Index: id (primary key)
// Index: timestamp (for cache expiration)
```

**Cache Invalidation:**
- Clear entries older than 30 days
- Clear if file size changes (indicates different photo with same name)
- Manual clear option in settings

##### 2. `thumbnails`
**Purpose:** Store downscaled images for faster re-analysis

```typescript
interface ThumbnailCache {
  id: string;                    // Same ID as PhotoAnalysisCache
  thumbnail: Blob;               // Scaled-down image (max 800px)
  width: number;
  height: number;
  timestamp: number;
}

// Index: id (primary key)
```

**Thumbnail Specs:**
- Max dimension: 800px
- Format: JPEG at 85% quality
- Used for: Color analysis, composition analysis (faster than re-loading full image)

##### 3. `photoMetadata`
**Purpose:** Store EXIF data and other metadata

```typescript
interface PhotoMetadataCache {
  id: string;
  dateTaken?: Date;
  location?: { lat: number; lng: number };
  camera?: string;
  lens?: string;
  focalLength?: number;
  iso?: number;
  aperture?: number;
  originalFilename: string;
}

// Index: id (primary key)
// Index: dateTaken (for time-based grouping)
```

### LocalStorage Keys

```typescript
// User preferences
'sff-preferences': JSON<UserPreferences>

// Feature toggles
'sff-face-detection-enabled': boolean
'sff-auto-analyze-enabled': boolean

// Last session state
'sff-last-min-dpi': number
'sff-last-color-scheme': 'balanced' | 'monochrome' | 'vibrant' | 'any'
```

### Cache Management API

```typescript
class CacheManager {
  private db: IDBDatabase;
  
  // Initialize database
  async init(): Promise<void>;
  
  // Photo analysis cache
  async getAnalysis(photoId: string): Promise<PhotoAnalysisCache | null>;
  async setAnalysis(photoId: string, analysis: PhotoAnalysisCache): Promise<void>;
  async hasAnalysis(photoId: string): Promise<boolean>;
  
  // Thumbnail cache
  async getThumbnail(photoId: string): Promise<Blob | null>;
  async setThumbnail(photoId: string, thumbnail: Blob, dimensions: {width: number, height: number}): Promise<void>;
  
  // Metadata cache
  async getMetadata(photoId: string): Promise<PhotoMetadataCache | null>;
  async setMetadata(photoId: string, metadata: PhotoMetadataCache): Promise<void>;
  
  // Cache maintenance
  async clearOldEntries(daysOld: number = 30): Promise<number>; // Returns count cleared
  async clearAll(): Promise<void>;
  async getStorageSize(): Promise<number>; // Bytes used
}
```

### What's NOT Cached

1. **TensorFlow.js Models** - Browser's HTTP cache handles this automatically
2. **Match Scores** - Always recalculated because they depend on:
   - Current frame layout
   - Adjacent frames
   - User preferences at that moment
3. **Global Optimization Results** - Too dependent on current state
4. **Preview Images** - Generated on-demand

---

## Web Worker Architecture

### Existing Pattern (Smart Layout)

You mentioned Smart Layout already uses Web Workers for layout algorithms. Smart Frame Filler should follow the same pattern.

### Worker Structure

#### Main Thread → Worker Communication

```typescript
// main thread (React component)
interface AnalysisJob {
  id: string;
  type: 'analyze-photo' | 'analyze-batch' | 'calculate-scores';
  payload: {
    photoData?: ArrayBuffer;    // For new analysis
    photoIds?: string[];        // For batch processing
    frameData?: Frame[];        // For scoring
  };
}

interface AnalysisResult {
  jobId: string;
  type: 'analysis-complete' | 'score-complete' | 'progress';
  payload: any;
  error?: string;
}

// Usage in React component
const worker = useRef<Worker>();

useEffect(() => {
  worker.current = new Worker(
    new URL('./workers/photo-analysis.worker.ts', import.meta.url),
    { type: 'module' }
  );
  
  worker.current.onmessage = (e: MessageEvent<AnalysisResult>) => {
    handleWorkerMessage(e.data);
  };
  
  return () => worker.current?.terminate();
}, []);

const analyzePhoto = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  
  worker.current.postMessage({
    id: crypto.randomUUID(),
    type: 'analyze-photo',
    payload: { photoData: arrayBuffer }
  });
};
```

#### Worker Implementation

**File:** `src/workers/photo-analysis.worker.ts`

```typescript
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

let blazefaceModel: blazeface.BlazeFaceModel | null = null;

// Initialize models on first use
async function initModels() {
  if (!blazefaceModel) {
    await tf.ready();
    blazefaceModel = await blazeface.load();
  }
}

// Message handler
self.onmessage = async (e: MessageEvent<AnalysisJob>) => {
  const { id, type, payload } = e.data;
  
  try {
    switch (type) {
      case 'analyze-photo':
        const result = await analyzePhotoInWorker(payload.photoData!);
        self.postMessage({
          jobId: id,
          type: 'analysis-complete',
          payload: result
        });
        break;
        
      case 'analyze-batch':
        // Process photos one at a time, send progress updates
        for (let i = 0; i < payload.photoIds!.length; i++) {
          // Analysis logic...
          
          // Send progress
          self.postMessage({
            jobId: id,
            type: 'progress',
            payload: { current: i + 1, total: payload.photoIds!.length }
          });
        }
        break;
        
      case 'calculate-scores':
        const scores = calculateMatchScores(payload);
        self.postMessage({
          jobId: id,
          type: 'score-complete',
          payload: scores
        });
        break;
    }
  } catch (error) {
    self.postMessage({
      jobId: id,
      type: 'analysis-complete',
      error: error.message
    });
  }
};

async function analyzePhotoInWorker(photoData: ArrayBuffer): Promise<PhotoAnalysis> {
  await initModels();
  
  // Create ImageBitmap from ArrayBuffer (works in worker)
  const blob = new Blob([photoData]);
  const imageBitmap = await createImageBitmap(blob);
  
  // Run analyses
  const [colorProfile, faceDetection, composition, resolution] = await Promise.all([
    analyzeColors(imageBitmap),
    detectFaces(imageBitmap),
    analyzeComposition(imageBitmap),
    analyzeResolution(imageBitmap)
  ]);
  
  return {
    colorProfile,
    faceDetection,
    compositionProfile: composition,
    resolutionProfile: resolution
  };
}

// Color analysis doesn't need ML, can run in worker
function analyzeColors(imageBitmap: ImageBitmap): ColorProfile {
  // Create OffscreenCanvas (worker-compatible)
  const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  const ctx = canvas.getContext('2d')!;
  
  ctx.drawImage(imageBitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Run color quantization...
  return {
    dominantColors: extractDominantColors(imageData),
    averageColor: calculateAverageColor(imageData),
    saturation: calculateSaturation(imageData),
    brightness: calculateBrightness(imageData),
    colorPalette: generatePalette(imageData),
    colorHarmony: classifyHarmony(imageData)
  };
}

async function detectFaces(imageBitmap: ImageBitmap): Promise<FaceDetection> {
  if (!blazefaceModel) {
    await initModels();
  }
  
  // TensorFlow.js works with ImageBitmap in workers
  const predictions = await blazefaceModel!.estimateFaces(imageBitmap, false);
  
  return {
    hasFaces: predictions.length > 0,
    faceCount: predictions.length,
    faceBoundingBoxes: predictions.map(p => ({
      topLeft: p.topLeft as [number, number],
      bottomRight: p.bottomRight as [number, number]
    })),
    primaryFaceLocation: determineFaceLocation(predictions[0]),
    faceAreaPercentage: calculateFaceArea(predictions, imageBitmap),
    isPortrait: predictions.length === 1,
    isGroup: predictions.length > 1
  };
}
```

### Performance Considerations

#### Parallel vs Sequential Processing

```typescript
// For batch analysis, use queue to avoid memory issues
class AnalysisQueue {
  private queue: AnalysisJob[] = [];
  private processing = false;
  private concurrentLimit = 2; // Process 2 photos at once max
  
  enqueue(job: AnalysisJob) {
    this.queue.push(job);
    this.processNext();
  }
  
  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    // Take up to concurrentLimit jobs
    const batch = this.queue.splice(0, this.concurrentLimit);
    
    await Promise.all(batch.map(job => this.processJob(job)));
    
    this.processing = false;
    
    // Continue if more in queue
    if (this.queue.length > 0) {
      this.processNext();
    }
  }
  
  private async processJob(job: AnalysisJob) {
    // Check cache first
    const cached = await cacheManager.getAnalysis(job.id);
    if (cached) {
      return cached;
    }
    
    // Send to worker
    return analyzeInWorker(job);
  }
}
```

#### Memory Management

```typescript
// Limit thumbnail cache size
const MAX_CACHE_SIZE_MB = 50;

async function checkCacheSize() {
  const sizeBytes = await cacheManager.getStorageSize();
  const sizeMB = sizeBytes / (1024 * 1024);
  
  if (sizeMB > MAX_CACHE_SIZE_MB) {
    // Clear oldest entries first
    await cacheManager.clearOldEntries(30);
    
    // If still too large, clear more aggressively
    const newSize = await cacheManager.getStorageSize();
    if (newSize / (1024 * 1024) > MAX_CACHE_SIZE_MB) {
      await cacheManager.clearOldEntries(7); // Last week only
    }
  }
}
```

### Integration with Existing Smart Layout Worker

**Option 1: Separate Workers (Recommended)**
- Keep Smart Layout worker separate
- Create new Photo Analysis worker
- Cleaner separation of concerns
- Can run simultaneously without blocking each other

**Option 2: Shared Worker Pool**
- Create a worker pool manager
- Route different job types to available workers
- More complex but potentially more efficient

```typescript
// Shared worker pool approach
class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private jobQueue: Map<string, AnalysisJob> = new Map();
  
  constructor(size: number = 2) {
    for (let i = 0; i < size; i++) {
      const worker = new Worker(
        new URL('./workers/shared.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      worker.onmessage = (e) => this.handleWorkerMessage(e, worker);
      
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }
  
  async submitJob(job: AnalysisJob): Promise<any> {
    return new Promise((resolve, reject) => {
      this.jobQueue.set(job.id, { job, resolve, reject });
      this.assignJobs();
    });
  }
  
  private assignJobs() {
    while (this.availableWorkers.length > 0 && this.jobQueue.size > 0) {
      const worker = this.availableWorkers.pop()!;
      const [jobId, { job, resolve, reject }] = this.jobQueue.entries().next().value;
      
      this.jobQueue.delete(jobId);
      worker.postMessage(job);
    }
  }
  
  private handleWorkerMessage(e: MessageEvent, worker: Worker) {
    // Handle result...
    
    // Return worker to pool
    this.availableWorkers.push(worker);
    this.assignJobs();
  }
}
```

---

## React Hook with Caching

```typescript
function useSmartFrameFiller() {
  const worker = useRef<Worker>();
  const cacheManager = useRef<CacheManager>();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Initialize cache
    cacheManager.current = new CacheManager();
    cacheManager.current.init().then(() => {
      // Initialize worker
      worker.current = new Worker(
        new URL('./workers/photo-analysis.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      setIsReady(true);
    });
    
    return () => {
      worker.current?.terminate();
    };
  }, []);
  
  const analyzePhoto = async (file: File): Promise<PhotoAnalysis> => {
    // Generate stable ID from file
    const photoId = await generatePhotoId(file);
    
    // Check cache first
    const cached = await cacheManager.current!.getAnalysis(photoId);
    if (cached && cached.fileSize === file.size) {
      console.log('Using cached analysis for', file.name);
      return cached.analysis;
    }
    
    // Not in cache, analyze with worker
    console.log('Analyzing', file.name);
    const arrayBuffer = await file.arrayBuffer();
    
    return new Promise((resolve, reject) => {
      const jobId = crypto.randomUUID();
      
      const handler = (e: MessageEvent<AnalysisResult>) => {
        if (e.data.jobId === jobId) {
          worker.current!.removeEventListener('message', handler);
          
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            // Cache the result
            cacheManager.current!.setAnalysis(photoId, {
              id: photoId,
              timestamp: Date.now(),
              fileSize: file.size,
              analysis: e.data.payload
            });
            
            resolve(e.data.payload);
          }
        }
      };
      
      worker.current!.addEventListener('message', handler);
      
      worker.current!.postMessage({
        id: jobId,
        type: 'analyze-photo',
        payload: { photoData: arrayBuffer }
      });
    });
  };
  
  return {
    isReady,
    analyzePhoto,
    clearCache: () => cacheManager.current!.clearAll()
  };
}

// Generate stable photo ID from file content
async function generatePhotoId(file: File): Promise<string> {
  // Use file name + size + last modified as simple hash
  // For more robust solution, could hash first 10KB of file
  const data = `${file.name}-${file.size}-${file.lastModified}`;
  
  // Simple hash
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

---

## Testing Strategy for Your Use Case

Since you'll be testing with your own photo library:

### Manual Testing Checklist

#### Phase 1: Basic Analysis (Week 1-2)
- [ ] Upload 10-20 photos of different types
- [ ] Verify color analysis makes sense (dominant colors look correct)
- [ ] Check aspect ratio detection (landscape vs portrait)
- [ ] Verify DPI calculations for different frame sizes
- [ ] Test with mix of high-res and phone camera photos

#### Phase 2: Face Detection (Week 3-4)
- [ ] Test with portraits (single person)
- [ ] Test with group photos
- [ ] Test with no faces (landscapes, objects)
- [ ] Verify face location detection (center vs edge)
- [ ] Check performance (should be <2s per photo)

#### Phase 3: Matching (Week 5-6)
- [ ] Create simple 3x3 gallery layout
- [ ] Upload 20 photos
- [ ] Verify suggestions make sense
- [ ] Try "Accept All" and see results
- [ ] Test manual override (swap suggestions)

#### Phase 4: Performance (Week 9-10)
- [ ] Upload 100+ photos
- [ ] Check memory usage (browser dev tools)
- [ ] Verify caching works (re-upload same photos)
- [ ] Test on mobile browser
- [ ] Check battery impact on phone

### Key Metrics to Watch

```typescript
// Add telemetry (local only)
interface PerformanceMetrics {
  analysisTimeMs: number;
  cacheHitRate: number;
  memoryUsageMB: number;
  batchSize: number;
}

// Log to console during testing
function logMetrics(metrics: PerformanceMetrics) {
  console.table({
    'Analysis Time': `${metrics.analysisTimeMs}ms`,
    'Cache Hits': `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
    'Memory': `${metrics.memoryUsageMB.toFixed(1)}MB`,
    'Batch Size': metrics.batchSize
  });
}
```

### Red Flags to Watch For

1. **Analysis takes >5s per photo** - Thumbnail generation might be too large
2. **Cache hit rate <50%** - Photo ID generation might be unstable
3. **Memory usage >500MB** - Cache might be too aggressive
4. **Browser crashes with 100+ photos** - Need better batch processing
5. **Suggestions don't make sense** - Scoring weights need tuning

---

## Summary

**Caching:**
- IndexedDB: Analysis results, thumbnails, metadata
- LocalStorage: User preferences, feature flags
- NOT cached: Models (browser does it), match scores (recalculated)

**Web Workers:**
- Follow same pattern as Smart Layout
- Separate worker for photo analysis
- Use OffscreenCanvas and ImageBitmap for worker-compatible image processing
- Queue system for batch processing

**Testing:**
- Your own photo library is perfect for testing
- Focus on performance metrics and cache hit rates
- Watch for memory issues with large batches

The spec is comprehensive enough for agentic coding tools, but you can iterate based on what you find during testing!
