import React from 'react';
import styles from './LandingCarousel.module.css';
import AutoplayVideo from '../Common/AutoplayVideo';

interface Slide {
    type: 'video' | 'image';
    src?: string;
    srcSet?: string;
    sizes?: string;
    sources?: { src: string; type: string }[];
    alt?: string;
}

const SLIDES: Slide[] = [
    {
        type: 'video',
        src: '/templates.mp4'
    },
    {
        type: 'video',
        src: '/align-frames.mp4'
    },
    {
        type: 'image',
        src: '/hanging_guide.webp',
        srcSet: '/hanging_guide_mobile.webp 400w, /hanging_guide.webp 1084w',
        sizes: '(max-width: 768px) 400px, 500px',
        alt: 'PDF Hanging Guide'
    }
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
                    key={index}
                    className={`${styles.slide} ${index === currentIndex ? styles.active : ''}`}
                    onClick={() => onChange(index)}
                >
                    {slide.type === 'video' ? (
                        <AutoplayVideo
                            src={slide.src}
                            sources={slide.sources}
                            className={styles.media}
                            isActive={index === currentIndex}
                            preload="metadata"
                        />
                    ) : (
                        <img
                            src={slide.src}
                            srcSet={slide.srcSet}
                            sizes={slide.sizes}
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
