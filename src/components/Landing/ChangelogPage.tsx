import React from 'react';
import StaticPageLayout from '../Layout/StaticPageLayout';

const ChangelogPage: React.FC = () => {
    return (
        <StaticPageLayout
            slug="changelog"
            title="What's New"
            description="The latest updates and improvements to GalleryPlanner."
        />
    );
};

export default ChangelogPage;
