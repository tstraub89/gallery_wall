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
    const [hasMounted, setHasMounted] = React.useState(false);
    const [shouldRenderVideo, setShouldRenderVideo] = React.useState(false);

    // 1. Handle Hydration & Initial Mounting
    useEffect(() => {
        setHasMounted(true);
    }, []);

    // 2. Handle Visibility (Intersection Observer)
    useEffect(() => {
        if (!hasMounted) return;
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsInView(entry.isIntersecting);
            // If it ever enters view, we should at least mount the tag to get metadata
            if (entry.isIntersecting) setShouldRenderVideo(true);
        }, {
            threshold: 0.1,
            rootMargin: '50px' // Slightly less aggressive than before
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, [hasMounted]);

    // 3. Mount video if active (e.g. for carousel slides even if off-screen/clipped)
    useEffect(() => {
        if (isActive) setShouldRenderVideo(true);
    }, [isActive]);

    // 4. Handle Playback Logic
    useEffect(() => {
        if (!shouldRenderVideo) return;
        const video = videoRef.current;
        if (!video) return;

        // Force muted property
        video.muted = true;
        video.defaultMuted = true;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        const shouldPlay = isActive && isInView;

        if (shouldPlay) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    setIsPlaying(false);
                });
            }
        } else {
            video.pause();
        }

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [shouldRenderVideo, isActive, isInView]);

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
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                background: '#f2f2f7', // Consistent placeholder color
                ...style
            }}
            className={className}
        >
            {hasMounted && shouldRenderVideo && (
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
            )}

            {/* Play Overlay */}
            {!isPlaying && (isActive || isInView) && hasMounted && (
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
                        background: 'rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                >
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.3)',
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
