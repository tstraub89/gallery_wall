import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import styles from '../Landing/LandingPage.module.css'; // Utilizing existing variables if possible, or inline styles

const BackToTop: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 500) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    if (!isVisible) {
        return null;
    }

    return (
        <button
            onClick={scrollToTop}
            style={{
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                zIndex: 99,
                border: 'none',
                outline: 'none',
                backgroundColor: '#007aff',
                color: 'white',
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '50%',
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.3s, transform 0.3s',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            }}
            aria-label="Back to Top"
        >
            <ArrowUp size={24} />
        </button>
    );
};

export default BackToTop;
