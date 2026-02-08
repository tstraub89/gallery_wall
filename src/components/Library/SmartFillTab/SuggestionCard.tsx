import React, { useEffect, useState } from 'react';
import { getImage } from '../../../utils/imageStore';
import { FrameSuggestion } from '../../../smartfill/types';
import styles from './SuggestionCard.module.css';
import { AlertCircle, Check } from 'lucide-react';

interface SuggestionCardProps {
    suggestion: FrameSuggestion;
    onClick: (suggestion: FrameSuggestion) => void;
    showFaceScore?: boolean;
    aspectRatio?: number;
    isUsedElsewhere?: boolean;
    isCurrentMatch?: boolean;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
    suggestion,
    onClick,
    showFaceScore = false,
    aspectRatio = 1,
    isUsedElsewhere = false,
    isCurrentMatch = false
}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    // ... useEffect remains same ...
    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                // Use preview (or thumb) for speed
                const blob = await getImage(suggestion.photoId, 'thumb');
                if (blob && active) {
                    setImageUrl(URL.createObjectURL(blob));
                }
            } catch (e) {
                console.error("Failed to load suggestion image", e);
            }
        };
        load();
        return () => { active = false; };
    }, [suggestion.photoId]);

    const scoreColor = suggestion.matchScore.totalScore > 80 ? '#4caf50' :
        suggestion.matchScore.totalScore > 50 ? '#ff9800' : '#f44336';

    const { breakdown } = suggestion.matchScore;
    const tooltip = [
        `Aspect Ratio: ${breakdown.aspectRatio}/25`,
        `Resolution: ${breakdown.resolution}/25`,
        `Composition: ${breakdown.composition}/20`,
        `Color: ${breakdown.colorHarmony}/15`,
        `Faces: ${showFaceScore ? `${breakdown.faceHandling}/15` : 'N/A'}`
    ].join('\n');

    return (
        <div
            className={styles.card}
            onClick={() => onClick(suggestion)}
            title={tooltip}
        >
            <div className={styles.imageContainer} style={{ aspectRatio: `${aspectRatio}` }}>
                {imageUrl ? (
                    <img src={imageUrl} alt="Suggestion" className={styles.image} />
                ) : (
                    <div className={styles.placeholder} />
                )}

                {isUsedElsewhere ? (
                    <div className={styles.usedBadge} title="Already used in another frame">
                        <AlertCircle size={14} />
                    </div>
                ) : isCurrentMatch ? (
                    <div className={styles.matchBadge} title="Currently in this frame">
                        <Check size={14} />
                    </div>
                ) : null}

                <div className={styles.scoreBadge} style={{ backgroundColor: scoreColor }}>
                    {Math.round(suggestion.matchScore.totalScore)}
                </div>
            </div>
        </div>
    );
};

export default SuggestionCard;
