import React from 'react';
import styles from './LandingCarousel.module.css';
import AutoplayVideo from '../Common/AutoplayVideo';

interface Slide {
    type: 'video' | 'image';
    src?: string;
    sources?: { src: string; type: string }[];
    alt?: string;
}

const SLIDES: Slide[] = [
    {
        type: 'video',
        sources: [
            { src: '/templates.webm', type: 'video/webm' },
            { src: '/templates.mp4', type: 'video/mp4' }
        ]
    },
    {
        type: 'video',
        sources: [
            { src: '/align-frames.webm', type: 'video/webm' },
            { src: '/align-frames.mp4', type: 'video/mp4' }
        ]
    },
    { type: 'image', src: '/hanging_guide.webp', alt: 'PDF Hanging Guide' }
];

interface LandingCarouselProps {
    currentIndex: number;
    onChange: (index: number) => void;
}

const LandingCarousel: React.FC<LandingCarouselProps> = ({ currentIndex, onChange }) => {
    return (
        <div className={styles.carouselContainer}>
            {SLIDES.map((slide, index) => (
                <div
                    key={slide.src}
                    className={`${styles.slide} ${index === currentIndex ? styles.active : ''}`}
                    onClick={() => onChange(index)}
                >
                    {slide.type === 'video' ? (
                        <AutoplayVideo
                            src={slide.src}
                            sources={slide.sources}
                            className={styles.media}
                            isActive={index === currentIndex}
                        />
                    ) : (
                        <img
                            src={slide.src}
                            alt={slide.alt}
                            className={styles.media}
                        />
                    )}
                </div>
            ))}
            {/* Dots removed as control is now external */}
        </div>
    );
};

export default LandingCarousel;
