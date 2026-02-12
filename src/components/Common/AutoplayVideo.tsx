import React, { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

interface AutoplayVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    src?: string; // Optional if sources are provided
    sources?: { src: string; type: string }[];
    className?: string;
    isActive?: boolean; // Control playback externally (e.g., carousel slide active)
    poster?: string;
}



// ... interface

// ... imports

const AutoplayVideo: React.FC<AutoplayVideoProps> = React.memo(({ src, sources, className, style, isActive = true, poster, ...props }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isInView, setIsInView] = React.useState(false);

    // 1. Handle Visibility (Intersection Observer)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsInView(entry.isIntersecting);
        }, {
            threshold: 0.1, // Slightly more lenient for mobile
            rootMargin: '100px' // Start loading/playing before it hit the viewport
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // 2. Handle Playback Logic
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Force muted property
        video.muted = true;
        video.defaultMuted = true;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        // Only play if:
        // 1. Component is "Active" (e.g. current slide)
        // 2. Component is "In View" (scrolled near viewport)
        const shouldPlay = isActive && isInView;

        if (shouldPlay) {
            // Attempt to play when active
            // video.currentTime = 0; // Removing reset on view to avoid jarring restarts when scrolling
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Suppress autoplay errors
                    setIsPlaying(false);
                });
            }
        } else {
            // Pause if not active to save resources
            video.pause();
        }

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [src, sources, isActive, isInView]);

    const togglePlayback = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().catch(() => { });
        } else {
            videoRef.current.pause();
        }
    };

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', width: '100%', height: '100%', ...style }}
            className={className}
        >
            <video
                ref={videoRef}
                onClick={togglePlayback}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                loop
                muted
                playsInline
                preload="metadata"
                poster={poster}
                onContextMenu={(e) => e.preventDefault()}
                {...props}
            >
                {sources ? (
                    sources.map((source, index) => (
                        <source key={index} src={source.src} type={source.type} />
                    ))
                ) : (
                    <source src={src} />
                )}
            </video>

            {/* Play Overlay */}
            {!isPlaying && isActive && isInView && (
                <div
                    onClick={togglePlayback}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                >
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s',
                    }}>
                        <Play fill="white" stroke="none" size={32} style={{ marginLeft: '4px' }} />
                    </div>
                </div>
            )}
        </div>
    );
});

export default AutoplayVideo;
