/**
 * String utility functions used across the application.
 */

/**
 * Convert a string to a URL-friendly slug.
 * Used for generating heading IDs in articles and other URL-safe identifiers.
 */
export const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Spaces to hyphens  
        .replace(/--+/g, '-') // Collapse multiple hyphens
        .trim();
};

/**
 * Strip markdown formatting from display text.
 * Useful for extracting plain text from markdown content.
 */
export const stripMarkdown = (text: string): string => {
    return text
        .replace(/\*\*(.+?)\*\*/g, '$1') // Bold **text**
        .replace(/\*(.+?)\*/g, '$1') // Italic *text*
        .replace(/`(.+?)`/g, '$1') // Code `text`
        .replace(/~~(.+?)~~/g, '$1') // Strikethrough
        .trim();
};

/**
 * Extract plain text content from React children.
 * Recursively handles nested elements.
 */
export const getTextContent = (children: unknown): string => {
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) {
        return children.map(getTextContent).join('');
    }
    if (children && typeof children === 'object' && 'props' in children) {
        const props = (children as { props?: { children?: unknown } }).props;
        if (props?.children) {
            return getTextContent(props.children);
        }
    }
    return '';
};
