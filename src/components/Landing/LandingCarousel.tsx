import React from 'react';
import styles from './LandingCarousel.module.css';

interface Slide {
    type: 'video' | 'image';
    src: string;
    alt?: string;
}

const SLIDES: Slide[] = [
    { type: 'video', src: '/templates.webm' },
    { type: 'video', src: '/align-frames.webm' },
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
                        <video
                            src={slide.src}
                            className={styles.media}
                            autoPlay
                            loop
                            muted
                            playsInline
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
