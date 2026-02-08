
import React, { useEffect, useState } from 'react';
import styles from './SmartFillTab.module.css';
import { useSmartFill } from '../../../hooks/useSmartFill';
import { useProject } from '../../../context/ProjectContext';
import { useProModal } from '../../../context/ProContext';
import { FrameSuggestion } from '../../../smartfill/types';
import { Frame } from '../../../types';
import SuggestionCard from './SuggestionCard';
import { useSelection } from '../../../context/SelectionContext';

const SmartFillTab: React.FC = () => {
    const {
        analyzeLibrary,
        checkAnalysisStatus,
        getSuggestionsForFrame,
        generateGallerySolutions,
        isAnalyzing,
        progress
    } = useSmartFill();

    const { currentProject, updateProject } = useProject();
    const { selectedFrameIds } = useSelection();
    const { featuresUnlocked, openProModal } = useProModal();

    const [suggestions, setSuggestions] = useState<FrameSuggestion[]>([]);
    const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);

    const [prioritizePeople, setPrioritizePeople] = useState(() => {
        return localStorage.getItem('smartFill_targetFaces') === 'true';
    });
    const [preferBlackAndWhite, setPreferBlackAndWhite] = useState(() => {
        return localStorage.getItem('smartFill_preferBlackAndWhite') === 'true';
    });
    const [preferVibrant, setPreferVibrant] = useState(() => {
        return localStorage.getItem('smartFill_preferVibrant') === 'true';
    });
    const [needsAnalysis, setNeedsAnalysis] = useState(false);

    // Persist preferences
    useEffect(() => {
        localStorage.setItem('smartFill_targetFaces', String(prioritizePeople));
        localStorage.setItem('smartFill_preferBlackAndWhite', String(preferBlackAndWhite));
        localStorage.setItem('smartFill_preferVibrant', String(preferVibrant));
    }, [prioritizePeople, preferBlackAndWhite, preferVibrant]);

    // Check analysis status
    useEffect(() => {
        if (currentProject) {
            checkAnalysisStatus(currentProject.images, { detectFaces: prioritizePeople })
                .then(isValid => setNeedsAnalysis(!isValid));
        }
    }, [currentProject, prioritizePeople, checkAnalysisStatus, isAnalyzing]); // Add isAnalyzing to re-check after analysis

    // Construct options object
    const scoringOptions = {
        targetFaces: prioritizePeople,
        preferBlackAndWhite,
        preferVibrant
    };

    useEffect(() => {
        if (selectedFrameIds.length === 1) {
            const frameId = selectedFrameIds[0];
            const frame = currentProject?.frames.find((f: Frame) => f.id === frameId);
            if (frame) {
                setSelectedFrame(frame);
                // Load suggestions
                getSuggestionsForFrame(frame, scoringOptions).then(setSuggestions);
            }
        } else {
            setSelectedFrame(null);
            setSuggestions([]);
        }
    }, [selectedFrameIds, currentProject?.frames, getSuggestionsForFrame, prioritizePeople, preferBlackAndWhite, preferVibrant]);

    const handleApplySuggestion = (suggestion: FrameSuggestion) => {
        if (!currentProject || !selectedFrame) return;

        // Apply photo to frame
        const updatedFrames = currentProject.frames.map((f: Frame) =>
            f.id === selectedFrame.id ? { ...f, imageId: suggestion.photoId } : f
        );

        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const handleAnalyze = () => {
        if (!featuresUnlocked) {
            openProModal();
            return;
        }

        if (currentProject) {
            analyzeLibrary(currentProject.images, { detectFaces: prioritizePeople });
        }
    };

    const handleFillAll = async () => {
        if (!featuresUnlocked) {
            openProModal();
            return;
        }

        if (!currentProject) return;

        const solutions = await generateGallerySolutions(1, scoringOptions);
        if (solutions.length > 0) {
            const sol = solutions[0];
            // Apply assignments
            const updatedFrames = currentProject.frames.map((f: Frame) => {
                const assigned = sol.assignments[f.id];
                return assigned ? { ...f, imageId: assigned } : f;
            });

            updateProject(currentProject.id, { frames: updatedFrames });
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <p className={styles.description}>
                    {isAnalyzing
                        ? `Analyzing library... ${Math.round(progress)}%`
                        : "Automatically fill your frames with the best photos."}
                </p>

                <div className={styles.options}>
                    <label className={styles.checkbox} title="Prioritize photos with faces (requires analysis)">
                        <input
                            type="checkbox"
                            checked={prioritizePeople}
                            onChange={(e) => setPrioritizePeople(e.target.checked)}
                        />
                        Target Faces
                    </label>
                    <label className={styles.checkbox} title="Prioritize black and white photos">
                        <input
                            type="checkbox"
                            checked={preferBlackAndWhite}
                            onChange={(e) => {
                                setPreferBlackAndWhite(e.target.checked);
                                if (e.target.checked) setPreferVibrant(false);
                            }}
                        />
                        Prefer B&W
                    </label>
                    <label className={styles.checkbox} title="Prioritize colorful, vibrant photos">
                        <input
                            type="checkbox"
                            checked={preferVibrant}
                            onChange={(e) => {
                                setPreferVibrant(e.target.checked);
                                if (e.target.checked) setPreferBlackAndWhite(false);
                            }}
                        />
                        Prefer Vibrant
                    </label>
                </div>

                <div className={styles.actions}>
                    {(needsAnalysis || isAnalyzing) && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className={styles.primaryButton}
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !currentProject?.images.length}
                                style={{ flex: 1 }}
                            >
                                {isAnalyzing ? 'Analyzing...' : 'Analyze Library'}
                            </button>
                        </div>
                    )}

                    {!needsAnalysis && !isAnalyzing && (
                        <div className={styles.emptyState} style={{ padding: '0.5rem', marginBottom: '1rem', background: '#e8f5e9', border: '1px solid #c8e6c9', color: '#2e7d32' }}>
                            ✓ Library Analyzed
                        </div>
                    )}

                    <div className={styles.divider}></div>

                    <button
                        className={styles.secondaryButton}
                        onClick={handleFillAll}
                        disabled={!currentProject?.images.length}
                    >
                        ✨ Fill All Frames (Lucky)
                    </button>

                    {selectedFrame ? (
                        <div className={styles.suggestions}>
                            <h4>Suggestions for selected frame</h4>
                            {suggestions.length === 0 ? (
                                <div className={styles.emptyState}>No matches found. Try analyzing library first.</div>
                            ) : (
                                <div className={styles.grid}>
                                    {suggestions.map(s => {
                                        const isCurrent = selectedFrame?.imageId === s.photoId;
                                        const isUsedElsewhere = currentProject?.frames.some(f => f.imageId === s.photoId && f.id !== selectedFrame?.id);

                                        return (
                                            <SuggestionCard
                                                key={s.photoId}
                                                suggestion={s}
                                                onClick={handleApplySuggestion}
                                                showFaceScore={prioritizePeople}
                                                aspectRatio={selectedFrame ? selectedFrame.width / selectedFrame.height : 1}
                                                isCurrentMatch={isCurrent}
                                                isUsedElsewhere={isUsedElsewhere}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            Select a single frame to see smart suggestions.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartFillTab;
