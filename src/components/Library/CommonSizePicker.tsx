import React from 'react';
import { COMMON_SIZES } from '../../constants/commonFrames';
import { DEFAULT_FRAME_BORDER_WIDTH, DEFAULT_FRAME_COLOR } from '../../constants';
import { useProject } from '../../hooks/useProject';
import { v4 as uuidv4 } from 'uuid';
import { trackEvent, APP_EVENTS } from '../../utils/analytics';
import styles from './CommonSizePicker.module.css';

const CommonSizePicker: React.FC = () => {
    const { addToLibrary, currentProjectId } = useProject();

    const handleAddSize = (width: number, height: number, label: string) => {
        if (!currentProjectId) return;
        trackEvent(APP_EVENTS.ADD_FRAME);

        const frame = {
            id: uuidv4(),
            width,
            height,
            label: `Common ${label}`,
            shape: 'rect',
            frameColor: DEFAULT_FRAME_COLOR,
            matted: undefined,
            borderWidth: DEFAULT_FRAME_BORDER_WIDTH,
            x: 0,
            y: 0,
            rotation: 0,
            zIndex: 0
        };

        addToLibrary(currentProjectId, frame);
    };

    return (
        <div className={styles.container}>
            <div className={styles.grid}>
                {COMMON_SIZES.map((size) => (
                    <button
                        key={size.label}
                        className={styles.sizeBtn}
                        onClick={() => handleAddSize(size.width, size.height, size.label)}
                        title={`Add ${size.label} to library`}
                    >
                        {size.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CommonSizePicker;
