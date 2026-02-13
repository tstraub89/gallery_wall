import React from 'react';
import styles from './ProjectSwitcher.module.css';
import { useProject } from '../../hooks/useProject';
import { Plus, Trash2, Check, X, Sparkles } from 'lucide-react';
import ConfirmDialog from '../Common/ConfirmDialog';
import ProjectNameDialog from '../Common/ProjectNameDialog';
import ProBadge from '../Common/ProBadge';

interface ProjectSwitcherProps {
    onClose: () => void;
}

const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({ onClose }) => {
    const { projects, currentProjectId, switchProject, addProject, deleteProject, importDemoProject } = useProject();
    const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null);
    const [isLoadingDemo, setIsLoadingDemo] = React.useState(false);
    const [showNameDialog, setShowNameDialog] = React.useState(false);

    const sortedProjects = Object.values(projects).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    const handleSelect = (id: string) => {
        if (id !== currentProjectId) {
            switchProject(id);
        }
        onClose();
    };

    const handleNew = () => {
        setShowNameDialog(true);
    };

    const handleConfirmName = (name: string) => {
        const id = addProject(name);
        switchProject(id);
        setShowNameDialog(false);
        onClose();
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setProjectToDelete(id);
    };

    const confirmDelete = () => {
        if (projectToDelete) {
            const isLast = Object.keys(projects).length === 1;
            deleteProject(projectToDelete);
            setProjectToDelete(null);
            if (isLast) {
                onClose();
            }
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.sheet} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Switch Project</h3>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.list}>
                    {sortedProjects.map(p => (
                        <div
                            key={p.id}
                            className={`${styles.item} ${p.id === currentProjectId ? styles.active : ''}`}
                            onClick={() => handleSelect(p.id)}
                        >
                            <div className={styles.info}>
                                <div className={styles.name}>{p.name}</div>
                                <div className={styles.date}>{new Date(p.updatedAt || 0).toLocaleDateString()}</div>
                            </div>
                            {p.id === currentProjectId && <Check size={18} className={styles.check} />}

                            {/* Don't allow deleting the only project seamlessly here without more logic, 
                                but ProjectContext handles "last project" deletion by creating a new one. 
                                We should probably just allow it. */}
                            <button
                                className={styles.deleteBtn}
                                onClick={(e) => handleDelete(p.id, e)}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className={styles.footer}>
                    <button className={styles.newBtn} onClick={handleNew}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} />
                            <span>New Project</span>
                        </div>
                        <ProBadge />
                    </button>

                    <button
                        className={styles.demoBtn}
                        onClick={async () => {
                            setIsLoadingDemo(true);
                            try {
                                await importDemoProject();
                                onClose();
                            } finally {
                                setIsLoadingDemo(false);
                            }
                        }}
                        disabled={isLoadingDemo}
                    >
                        <Sparkles size={18} />
                        <span>{isLoadingDemo ? 'Loading Example...' : 'Try Example Gallery'}</span>
                    </button>
                </div>
            </div>

            {projectToDelete && (
                <ConfirmDialog
                    title="Delete Project"
                    message="Are you sure? This cannot be undone."
                    confirmLabel="Delete"
                    isDanger
                    onConfirm={confirmDelete}
                    onCancel={() => setProjectToDelete(null)}
                />
            )}

            {showNameDialog && (
                <ProjectNameDialog
                    onConfirm={handleConfirmName}
                    onCancel={() => setShowNameDialog(false)}
                />
            )}
        </div>
    );
};

export default ProjectSwitcher;
