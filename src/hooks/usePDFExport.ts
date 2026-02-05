import { useState, useEffect, useRef } from 'react';
import { useProject } from './useProject';
import { exportCanvasToBlob, saveFile } from '../utils/exportUtils';
import { PPI } from '../constants';
import { trackEvent, PRO_EVENTS } from '../utils/analytics';
import type { Frame } from '../types';
import type { jsPDF } from 'jspdf';

export const usePDFExport = () => {
    const { currentProject } = useProject();
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [pdfReadyUrl, setPdfReadyUrl] = useState<string | null>(null);

    // Store the actual blob to avoid fetching it later, ensuring we stay 
    // within the brief user-gesture activation window on iOS Safari.
    const pdfBlobRef = useRef<Blob | null>(null);

    // Pre-warm the cache for the heavy PDF libraries.
    useEffect(() => {
        import('jspdf').catch(() => { });
        import('jspdf-autotable').catch(() => { });
    }, []);

    const clearPdfReady = () => {
        if (pdfReadyUrl) {
            URL.revokeObjectURL(pdfReadyUrl);
            setPdfReadyUrl(null);
        }
        pdfBlobRef.current = null;
    };

    const exportToPDFGuide = async () => {
        if (!currentProject) return;
        trackEvent(PRO_EVENTS.PDF_EXPORT);
        setIsExporting(true);
        setExportError(null);
        clearPdfReady();

        try {
            const [jsPDFMod, autoTableMod] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable')
            ]);
            const jsPDFClass = jsPDFMod.jsPDF;
            const autoTableFunc = autoTableMod.default;

            const { blob, error, cropRect } = await exportCanvasToBlob(currentProject, {
                cropToFrames: true,
                showWatermark: false
            });
            if (error || !blob) throw new Error(error || 'Failed to capture canvas');

            const doc = new jsPDFClass('p', 'in', 'a4');
            const margin = 0.5;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const contentWidth = pageWidth - (margin * 2);

            const drawBrandHeader = (pdf: jsPDF) => {
                const logoSize = 0.3;
                const hY = 0.5;
                const ox = margin;
                pdf.setDrawColor(0);
                pdf.setLineWidth(0.015);
                const s = logoSize / 24;
                pdf.roundedRect(ox + 3 * s, hY + 3 * s, 18 * s, 18 * s, 2 * s, 2 * s, 'S');
                pdf.circle(ox + 8.5 * s, hY + 8.5 * s, 1.5 * s, 'S');
                pdf.line(ox + 21 * s, hY + 15 * s, ox + 16 * s, hY + 10 * s);
                pdf.line(ox + 16 * s, hY + 10 * s, ox + 5 * s, hY + 21 * s);
                pdf.setFontSize(16);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(0);
                pdf.text('Gallery', ox + logoSize + 0.1, hY + 0.22);
                const gW = pdf.getTextWidth('Gallery');
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(100);
                pdf.text('Planner', ox + logoSize + 0.1 + gW, hY + 0.22);
                pdf.setFontSize(22);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(0);
                const titleText = 'Hanging Guide';
                pdf.text(titleText, pageWidth - margin - pdf.getTextWidth(titleText), hY + 0.22);
                pdf.setDrawColor(230);
                pdf.setLineWidth(0.01);
                pdf.line(margin, hY + 0.4, pageWidth - margin, hY + 0.4);
            };

            const drawFooter = (pdf: jsPDF, pageNum: number, totalPages: number) => {
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(150);
                const footText = `Page ${pageNum} / ${totalPages}`;
                pdf.text(footText, pageWidth / 2, pageHeight - 0.4, { align: 'center' });
            };

            drawBrandHeader(doc);
            let currentY = 1.15;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            const wallDim = `${currentProject.wallConfig.width}" x ${currentProject.wallConfig.height}"`;
            doc.text(`Project: ${currentProject.name || 'Untitled'}`, margin, currentY);
            doc.text(`Wall: ${wallDim} | Eye level: 58-60"`, margin, currentY + 0.2);
            currentY += 0.4;

            const imgData = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            const visW = cropRect ? cropRect.width : currentProject.wallConfig.width;
            const visH = cropRect ? cropRect.height : currentProject.wallConfig.height;
            const visualAspect = visW / visH;
            const maxH = 5.0;
            let finalW = contentWidth;
            let finalH = finalW / visualAspect;
            if (finalH > maxH) {
                finalH = maxH;
                finalW = finalH * visualAspect;
            }

            const imgX = margin + (contentWidth - finalW) / 2;
            doc.setDrawColor(200);
            doc.setLineWidth(0.01);
            doc.rect(imgX, currentY, finalW, finalH);
            doc.addImage(imgData, 'JPEG', imgX, currentY, finalW, finalH);

            const sourceFrames = [...currentProject.frames].sort((a, b) => (a.y / PPI) - (b.y / PPI));
            const rows: Frame[][] = [];
            if (sourceFrames.length > 0) {
                const assigned = new Set<string>();
                while (assigned.size < sourceFrames.length) {
                    const seed = sourceFrames.find(f => !assigned.has(f.id))!;
                    const row = [seed];
                    assigned.add(seed.id);
                    let foundMore = true;
                    while (foundMore) {
                        foundMore = false;
                        for (const f of sourceFrames) {
                            if (assigned.has(f.id)) continue;
                            const fTop = f.y / PPI;
                            const fBottom = fTop + f.height;
                            const anyOverlap = row.some(rf => {
                                const rfTop = rf.y / PPI;
                                const rfBottom = rfTop + rf.height;
                                const intersect = Math.max(0, Math.min(fBottom, rfBottom) - Math.max(fTop, rfTop));
                                const minH = Math.min(f.height, rf.height);
                                return intersect > minH * 0.2;
                            });
                            if (anyOverlap) {
                                row.push(f);
                                assigned.add(f.id);
                                foundMore = true;
                            }
                        }
                    }
                    rows.push(row.sort((a, b) => a.x - b.x));
                }
            }
            rows.sort((a, b) => {
                const avgA = a.reduce((sum, f) => sum + (f.y / PPI + f.height / 2), 0) / a.length;
                const avgB = b.reduce((sum, f) => sum + (f.y / PPI + f.height / 2), 0) / b.length;
                return avgA - avgB;
            });
            const sortedFrames = rows.flat();

            const scale = finalW / visW;
            const visualOffsetX = cropRect ? cropRect.x : 0;
            const visualOffsetY = cropRect ? cropRect.y : 0;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            sortedFrames.forEach((frame, index) => {
                const badgeX = imgX + ((frame.x / PPI - visualOffsetX) + frame.width / 2) * scale;
                const badgeY = currentY + ((frame.y / PPI - visualOffsetY) + frame.height / 2) * scale;
                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.01);
                doc.circle(badgeX, badgeY, 0.1, 'DF');
                doc.setTextColor(0);
                doc.text((index + 1).toString(), badgeX, badgeY, { align: 'center', baseline: 'middle' });
            });

            currentY += finalH + 0.4;

            const tableData = sortedFrames.map((frame, index) => {
                return [
                    index + 1,
                    frame.label || '',
                    `${frame.width}" x ${frame.height}"`,
                    frame.matted ? `${frame.matted.width}" x ${frame.matted.height}"` : 'Full',
                    `${(frame.x / PPI).toFixed(1)}"`,
                    `${(frame.y / PPI).toFixed(1)}"`,
                    `${(currentProject.wallConfig.height - (frame.y / PPI + frame.height / 2)).toFixed(1)}" center`
                ];
            });

            autoTableFunc(doc, {
                startY: currentY,
                head: [['#', 'Name', 'Outer Size', 'Opening', 'From Left', 'From Top', 'Hang Height']],
                body: tableData,
                margin: { left: margin, right: margin, top: 1.15, bottom: 0.6 },
                styles: { fontSize: 9, cellPadding: 0.08, overflow: 'linebreak' },
                headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 247, 250] },
                columnStyles: { 0: { cellWidth: 0.3, halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
                didDrawPage: (data) => {
                    if (data.pageNumber > 1) {
                        drawBrandHeader(doc);
                    }
                }
            });

            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                drawFooter(doc, i, totalPages);
            }

            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);

            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                // For mobile, cache the blob and let the UI trigger the final action.
                pdfBlobRef.current = pdfBlob;
                setPdfReadyUrl(url);
                setIsExporting(false);
            } else {
                // Desktop: Standard direct behavior
                const fileName = (currentProject.name || 'hanging_guide').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
                await saveFile(pdfBlob, fileName);
                URL.revokeObjectURL(url);
                setIsExporting(false);
            }

        } catch (err: any) {
            console.error('PDF Export failed:', err);
            setExportError(err.message || 'Export failed');
            setIsExporting(false);
        }
    };

    const triggerPdfShare = async () => {
        if (!currentProject) return;
        const blob = pdfBlobRef.current;
        const url = pdfReadyUrl;

        if (!blob || !url) return;

        const fileName = (currentProject.name || 'hanging_guide').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';

        try {
            // Priority 1: Native Share API (iOS Safari)
            if (navigator.share) {
                const file = new File([blob], fileName, { type: 'application/pdf' });
                // Note: We check canShare FIRST to avoid any async delay inside the try block
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Hanging Guide',
                    });
                    clearPdfReady();
                    return;
                }
            }

            // Priority 2: Force Open in New Tab (Desktop-like behavior for mobile)
            window.open(url, '_blank', 'noreferrer,noopener');
        } catch (err) {
            console.error('Share failure fallback', err);
            // Last resort: standard navigation
            window.open(url, '_blank');
        }
    };

    return {
        isExporting,
        exportError,
        setExportError,
        exportToPDFGuide,
        pdfReadyUrl,
        clearPdfReady,
        triggerPdfShare
    };
};
