import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { generateCode128B } from './barcode';

// Helper to format currency
const formatCurrency = (num) => {
    return "Rs. " + Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const exportDonationPDF = (data, expenses, currentView, selectedYear, summaryData, festivalName = 'UNITUS EVENT') => {
    try {
        const doc = new jsPDF('p', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const primaryColor = [255, 138, 43]; // Orange accent
        const secondaryColor = [60, 60, 60]; // Dark grey

        // --- Header Section ---
        // Big Title
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(`${festivalName.toUpperCase()} SAMITI`, pageWidth / 2, 50, { align: 'center' });

        // Subtitle
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...secondaryColor);
        const reportTitle = currentView === 'all' ? 'FULL FINANCIAL REPORT'
            : currentView === 'expenses' ? 'EXPENSE REPORT'
                : `${currentView.toUpperCase()} TRANSACTIONS REPORT`;
        doc.text(reportTitle, pageWidth / 2, 75, { align: 'center' });

        // Meta Info (Date, Year)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(`Generated on: ${dateStr}`, pageWidth / 2, 92, { align: 'center' });

        if (selectedYear !== 'all') {
            doc.text(`Fiscal Year: ${selectedYear}`, pageWidth / 2, 105, { align: 'center' });
        } else {
            doc.text(`Fiscal Year: All Time`, pageWidth / 2, 105, { align: 'center' });
        }

        let yPos = 130;

        // --- Summary Section (Boxed) ---
        if (summaryData) {
            // Summary Container Box
            doc.setDrawColor(200);
            doc.setFillColor(250, 250, 250);
            doc.roundedRect(40, yPos, pageWidth - 80, 95, 5, 5, 'FD');

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0);
            doc.text('Financial Summary', 55, yPos + 20);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            // Left Column
            doc.text(`Total Collection:`, 55, yPos + 40);
            doc.text(`Total Expenses:`, 55, yPos + 60);
            doc.text(`Senior Member Total:`, 55, yPos + 80);

            // Right Column Values
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 185, 129); // Green
            doc.text(formatCurrency(summaryData.totalCollection), 150, yPos + 40);

            doc.setTextColor(239, 68, 68); // Red
            doc.text(formatCurrency(summaryData.totalExpenses), 150, yPos + 60);

            doc.setTextColor(245, 158, 11); // Orange
            doc.text(formatCurrency(summaryData.seniorTotal), 150, yPos + 80);

            // Second Column
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0);
            doc.text(`Total Due Amount:`, 300, yPos + 40);
            doc.text(`Net Balance:`, 300, yPos + 60);

            // Second Column Values
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(239, 68, 68); // Red
            doc.text(formatCurrency(summaryData.totalDue), 400, yPos + 40);

            const balanceColor = summaryData.balance >= 0 ? [16, 185, 129] : [239, 68, 68];
            doc.setTextColor(...balanceColor);
            doc.text(formatCurrency(summaryData.balance), 400, yPos + 60);

            yPos += 115; // Move down below summary
        }

        // --- Table Section ---
        if (currentView === 'expenses') {
            // Filter expenses by year if needed
            let filteredExpenses = selectedYear === 'all' ? [...expenses] :
                expenses.filter(item => {
                    const itemYear = new Date(item.date).getFullYear().toString();
                    return itemYear === selectedYear;
                });

            const expensesTableData = filteredExpenses.map(r => [
                r.serial,
                r.date,
                r.item,
                formatCurrency(r.amount)
            ]);

            // Add Total Row
            const totalExp = filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
            expensesTableData.push(['', '', 'TOTAL', formatCurrency(totalExp)]);

            autoTable(doc, {
                startY: yPos,
                head: [['#', 'Date', 'Description', 'Amount']],
                body: expensesTableData,
                theme: 'striped',
                headStyles: {
                    fillColor: [239, 68, 68], // Red for expenses
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 40 }, // Serial
                    1: { cellWidth: 80 }, // Date
                    2: { cellWidth: 'auto' }, // Item
                    3: { cellWidth: 80, halign: 'right', fontStyle: 'bold' } // Amount
                },
                didParseCell: (data) => {
                    // Make total row bold
                    if (data.row.index === expensesTableData.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [245, 245, 245];
                    }
                }
            });

        } else {
            // Prepare data
            const donationsTableData = data.map(r => {
                const amount = r.cash || r.online || r.due || r.coupon || 0;
                let paymentMethod = '';
                if (r.cash) paymentMethod = 'Cash';
                else if (r.online) paymentMethod = 'Online';
                else if (r.due) paymentMethod = 'Due';
                else if (r.coupon) paymentMethod = 'Coupon';

                return [
                    r.serial,
                    r.uid || '-',
                    r.date,
                    r.name,
                    r.address || '-',
                    paymentMethod,
                    r.status || '-',
                    formatCurrency(amount)
                ];

            });

            // Add Total Row
            // Note: 'data' passed here is ALREADY filtered by the parent (App.jsx) based on viewType and Year
            // So we can sum it up directly.
            const totalAmt = data.reduce((sum, r) => sum + (r.cash || r.online || r.due || r.coupon || 0), 0);
            donationsTableData.push(['', '', '', 'TOTAL', '', '', '', formatCurrency(totalAmt)]);


            autoTable(doc, {
                startY: yPos,
                head: [['#', 'UID', 'Date', 'Name', 'Address', 'Method', 'Status', 'Amount']],
                body: donationsTableData,

                theme: 'striped',
                headStyles: {
                    fillColor: primaryColor,
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 30 }, // Serial
                    1: { cellWidth: 60, fontStyle: 'normal', font: 'courier' }, // UID
                    2: { cellWidth: 60 }, // Date
                    3: { cellWidth: 90, fontStyle: 'bold' }, // Name
                    4: { cellWidth: 'auto' }, // Address
                    5: { cellWidth: 45 }, // Method
                    6: { cellWidth: 55 }, // Status
                    7: { cellWidth: 70, halign: 'right', fontStyle: 'bold' } // Amount
                },
                didParseCell: (hookData) => {
                    // Last row is Total
                    if (hookData.row.index === donationsTableData.length - 1) {
                        hookData.cell.styles.fontStyle = 'bold';
                        hookData.cell.styles.fillColor = [240, 240, 240];
                        hookData.cell.styles.textColor = [0, 0, 0];
                        return;
                    }

                    // Color code payment methods in the Method column (index 5)
                    if (hookData.section === 'body' && hookData.column.index === 5) {
                        const val = hookData.cell.raw;
                        if (val === 'Cash') hookData.cell.styles.textColor = [16, 185, 129];
                        else if (val === 'Online') hookData.cell.styles.textColor = [59, 130, 246];
                        else if (val === 'Due') hookData.cell.styles.textColor = [239, 68, 68];
                        else if (val === 'Coupon') hookData.cell.styles.textColor = [245, 158, 11];
                    }
                }

            });
        }

        // --- Footer ---
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth - 50, pageHeight - 20);
            doc.text(`© ${festivalName} Samiti - Confidential Report`, 40, pageHeight - 20);
        }

        const viewText = currentView === 'all' ? 'All_Payments' : currentView.charAt(0).toUpperCase() + currentView.slice(1);
        const yearFilterText = selectedYear === 'all' ? 'All_Years' : `Year_${selectedYear}`;
        const cleanFestivalName = festivalName.replace(/[^a-zA-Z0-9]/g, '_');
        doc.save(`${cleanFestivalName}_Report_${viewText}_${yearFilterText}_${new Date().toISOString().split('T')[0]}.pdf`);
        return true;
    } catch (error) {
        console.error("Export PDF error:", error);
        return false;
    }
};

export const exportIndividualPDF = (donor, userDetails, festivalName = 'UNITUS EVENT') => {
    if (!donor) return false;

    try {
        const doc = new jsPDF('p', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        const amount = donor.cash || donor.online || donor.due || donor.coupon || 0;

        let paymentMethod = '';
        if (donor.cash) paymentMethod = 'Cash';
        else if (donor.online) paymentMethod = 'Online';
        else if (donor.due) paymentMethod = 'Due';
        else if (donor.coupon) paymentMethod = '20 R.S. Coupon';

        // Border
        doc.setDrawColor(255, 138, 43); // Orange border
        doc.setLineWidth(2);
        doc.rect(20, 20, pageWidth - 40, doc.internal.pageSize.height - 40);

        // Header Graphic (simple box for now, could be image if we had one)
        doc.setFillColor(255, 138, 43);
        doc.rect(20, 20, pageWidth - 40, 80, 'F');

        // Title on Header
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('DONATION RECEIPT', pageWidth / 2, 60, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`${festivalName.toUpperCase()} EVENT`, pageWidth / 2, 80, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        let yPos = 150;

        // Receipt Details
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('RECEIPT NO:', 40, yPos);
        doc.text('DATE:', pageWidth - 200, yPos);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        const festivalPrefix = festivalName.substring(0, 4).toUpperCase();
        doc.text(`${festivalPrefix}-${donor.serial.toString().padStart(4, '0')}`, 110, yPos);
        doc.text(`UID: ${donor.uid || '-'}`, 110, yPos + 15);
        doc.text(donor.date, pageWidth - 160, yPos);


        yPos += 30;

        // User Credentials Section (Requested)
        if (userDetails) {
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            doc.text('USER CREDENTIALS:', 40, yPos);

            doc.setFontSize(9);
            doc.setTextColor(50);

            const creds = `User: ${userDetails.username}  |  Role: ${userDetails.role.toUpperCase()}  |  Password: [Encrypted]`;
            doc.text(creds, 150, yPos);
            yPos += 30;
        }


        // "Received From" Section
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(40, yPos, pageWidth - 80, 120, 5, 5, 'F');

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        doc.text("RECEIVED WITH THANKS FROM:", 55, yPos + 25);

        doc.setFontSize(16);
        doc.setTextColor(255, 138, 43); // Orange Name
        doc.setFont('helvetica', 'bold');
        doc.text(donor.name.toUpperCase(), 55, yPos + 50);

        doc.setFontSize(12);
        doc.setTextColor(60);
        doc.setFont('helvetica', 'normal');
        doc.text(donor.address || 'No Address Provided', 55, yPos + 70);

        if (donor.status) {
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.setFillColor(60, 60, 60);
            // Status Badge
            const statusWidth = doc.getTextWidth(donor.status) + 20;
            doc.roundedRect(pageWidth - 60 - statusWidth, yPos + 15, statusWidth, 20, 10, 10, 'F');
            doc.text(donor.status, pageWidth - 60 - (statusWidth / 2), yPos + 28, { align: 'center' });
        }

        yPos += 150;

        // Amount Section
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text("AMOUNT:", 40, yPos);
        doc.text("PAYMENT METHOD:", 300, yPos);

        yPos += 25;
        doc.setFontSize(24);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(amount), 40, yPos);

        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text(paymentMethod, 300, yPos);

        yPos += 100;

        // Signature / Footer
        doc.setDrawColor(200);
        doc.setLineWidth(1);
        doc.line(pageWidth - 200, yPos, pageWidth - 50, yPos);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        doc.text("Authorized Signature", pageWidth - 125, yPos + 15, { align: 'center' });

        doc.text("Thank you for your generous contribution.", pageWidth / 2, doc.internal.pageSize.height - 60, { align: 'center' });

        const cleanName = donor.name.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanFestivalName = festivalName.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${cleanFestivalName}_Receipt_${cleanName}_${donor.serial}.pdf`;
        doc.save(fileName);
        return true;
    } catch (error) {
        console.error("Export Individual PDF error:", error);
        return false;
    }
};

export const exportDonationCSV = (data, currentView, selectedYear, festivalName = 'UNITUS EVENT') => {
    try {
        let csv;

        if (currentView === 'expenses') {
            csv = 'Serial,Date,Item,Amount\n';
            data.forEach(r => {
                const row = [
                    r.serial,
                    r.date,
                    `"${(r.item || '').replace(/"/g, '""')}"`,
                    r.amount
                ];
                csv += row.join(',') + '\n';
            });
        } else {
            csv = 'Serial,UID,Date,Name,Address,Amount,Method,Status\n';
            data.forEach(r => {

                const amount = r.cash || r.online || r.due || r.coupon || 0;
                let paymentMethod = '';
                if (r.cash) paymentMethod = 'Cash';
                else if (r.online) paymentMethod = 'Online';
                else if (r.due) paymentMethod = 'Due';
                else if (r.coupon) paymentMethod = '20 R.S. Coupon';

                const row = [
                    r.serial,
                    r.uid || '',
                    r.date,
                    `"${(r.name || '').replace(/"/g, '""')}"`,
                    `"${(r.address || '').replace(/"/g, '""')}"`,
                    amount,
                    paymentMethod,
                    `"${r.status || ''}"`
                ];

                csv += row.join(',') + '\n';
            });
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);

        const yearFilterText = selectedYear === 'all' ? 'All_Years' : `Year_${selectedYear}`;
        const viewText = currentView === 'all' ? 'All_Payments' : currentView.charAt(0).toUpperCase() + currentView.slice(1);
        const cleanFestivalName = festivalName.replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `${cleanFestivalName}_${viewText}_${yearFilterText}.csv`;
        a.click();
        return true;
    } catch (error) {
        console.error("Export CSV error:", error);
        return false;
    }
};

export const exportDevoteeCardPDF = (devotee, festivalName = 'UNITUS EVENT', options = {}) => {
    if (!devotee) return false;

    const {
        cardType = 'DEVOTEE',
        gender = 'M',
        validFrom = '',
        validUpto = '',
        clubName = festivalName,
        profileImage = null,
        bgMode = 'THEME',
        customColor = '#1e293b',
        customGradient = { start: '#4f46e5', end: '#06b6d4' }
    } = options;

    const hexToRgb = (hex) => {
        if (!hex || hex[0] !== '#') return [30, 41, 59];
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    };

    try {
        // Standard ATM Card (CR80) dimensions in points (1 pt = 1/72 inch)
        // 3.375 x 2.125 inches = 243 x 153 points
        const cardWidth = 243;
        const cardHeight = 153;

        // Create landscape PDF with exact card dimensions
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: [cardWidth, cardHeight]
        });

        // --- Background & Border ---
        // Role-based or Custom background color
        if (bgMode === 'SINGLE') {
            const rgb = hexToRgb(customColor);
            doc.setFillColor(rgb[0], rgb[1], rgb[2]);
            doc.rect(0, 0, cardWidth, cardHeight, 'F');
        } else if (bgMode === 'GRADIENT') {
            const start = hexToRgb(customGradient.start);
            const end = hexToRgb(customGradient.end);
            for (let i = 0; i < cardHeight; i++) {
                const ratio = i / cardHeight;
                const r = Math.round(start[0] + (end[0] - start[0]) * ratio);
                const g = Math.round(start[1] + (end[1] - start[1]) * ratio);
                const b = Math.round(start[2] + (end[2] - start[2]) * ratio);
                doc.setFillColor(r, g, b);
                doc.rect(0, i, cardWidth, 1.1, 'F');
            }
        } else if (cardType === 'ADMIN') {
            // High-Quality Linear Gradient for PDF (Saffron -> White -> Green)
            const saffron = [255, 153, 51];
            const white = [255, 255, 255];
            const green = [18, 136, 7];

            for (let i = 0; i < cardHeight; i++) {
                let r, g, b;
                const ratio = i / cardHeight;
                if (ratio < 0.5) {
                    // Saffron to White
                    const localRatio = ratio / 0.5;
                    r = Math.round(saffron[0] + (white[0] - saffron[0]) * localRatio);
                    g = Math.round(saffron[1] + (white[1] - saffron[1]) * localRatio);
                    b = Math.round(saffron[2] + (white[2] - saffron[2]) * localRatio);
                } else {
                    // White to Green
                    const localRatio = (ratio - 0.5) / 0.5;
                    r = Math.round(white[0] + (green[0] - white[0]) * localRatio);
                    g = Math.round(white[1] + (green[1] - white[1]) * localRatio);
                    b = Math.round(white[2] + (green[2] - white[2]) * localRatio);
                }
                doc.setFillColor(r, g, b);
                doc.rect(0, i, cardWidth, 1.1, 'F'); // 1.1 width to avoid gaps
            }
        } else if (cardType === 'MEMBER') {
            doc.setFillColor(6, 78, 59); // Deep Dark Green
            doc.rect(0, 0, cardWidth, cardHeight, 'F');
        } else {
            doc.setFillColor(15, 23, 42); // Slate-900
            doc.rect(0, 0, cardWidth, cardHeight, 'F');
        }

        // Decorative Gradient-like side panel
        doc.setFillColor(255, 138, 43); // Use a warm orange/saffron for the glow
        doc.setGState(new doc.GState({ opacity: cardType === 'ADMIN' ? 0.3 : 0.15 }));
        doc.circle(0, cardHeight / 2, 80, 'F');
        doc.setGState(new doc.GState({ opacity: 1.0 }));

        // Subtle Card Border
        doc.setDrawColor(255, 255, 255);
        doc.setGState(new doc.GState({ opacity: 0.1 }));
        doc.setLineWidth(1);
        doc.roundedRect(5, 5, cardWidth - 10, cardHeight - 10, 8, 8, 'D');
        doc.setGState(new doc.GState({ opacity: 1.0 }));

        // --- Left Branding Section ---
        const leftColWidth = 80;

        // Profile Image or Diya Symbol
        const symbolX = leftColWidth / 2 + 5;
        const symbolY = cardHeight / 2 - 15;

        if (profileImage) {
            try {
                const imgSize = 38;
                const imgX = symbolX - imgSize / 2;
                const imgY = symbolY - imgSize / 2;

                doc.saveGraphicsState();
                doc.circle(symbolX, symbolY, imgSize / 2, 'K');
                doc.clip();
                doc.addImage(profileImage, 'JPEG', imgX, imgY, imgSize, imgSize);
                doc.restoreGraphicsState();

                // Border ring (sits perfectly on outer edge)
                doc.setDrawColor(255, 138, 43);
                doc.setLineWidth(1.2);
                doc.circle(symbolX, symbolY, imgSize / 2, 'D');
            } catch (e) {
                console.error("Image render failed:", e);
                // Fallback to diya (Inlined for reliability)
                doc.setFillColor(255, 138, 43);
                doc.ellipse(symbolX, symbolY + 15, 12, 6, 'F');
                doc.setFillColor(255, 230, 100);
                doc.triangle(symbolX, symbolY + 2, symbolX - 4, symbolY + 12, symbolX + 4, symbolY + 12, 'F');
            }
        } else {
            // Default Diya (Inlined for reliability)
            doc.setFillColor(255, 138, 43);
            doc.ellipse(symbolX, symbolY + 15, 12, 6, 'F');
            doc.setFillColor(255, 230, 100);
            doc.triangle(symbolX, symbolY + 2, symbolX - 4, symbolY + 12, symbolX + 4, symbolY + 12, 'F');
        }

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50); // Direct dark gray for better readability on all backgrounds
        doc.setGState(new doc.GState({ opacity: 0.8 }));
        doc.text('OFFICIAL', leftColWidth / 2 + 5, cardHeight / 2 + 18, { align: 'center', charSpace: 1 });
        doc.text('MEMBER', leftColWidth / 2 + 5, cardHeight / 2 + 28, { align: 'center', charSpace: 1 });
        doc.setGState(new doc.GState({ opacity: 1.0 }));

        // Divider Line
        doc.setDrawColor(255, 255, 255);
        doc.setGState(new doc.GState({ opacity: 0.2 }));
        doc.line(leftColWidth + 5, 20, leftColWidth + 5, cardHeight - 20);
        doc.setGState(new doc.GState({ opacity: 1.0 }));

        // --- Right Content Section ---
        const contentStartX = leftColWidth + 20;

        // Festival Name Header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(cardType === 'ADMIN' ? 0 : 255, cardType === 'ADMIN' ? 0 : 138, cardType === 'ADMIN' ? 0 : 43); // Dark if Admin, Orange if others
        doc.text(festivalName.toUpperCase(), contentStartX, 25);

        // Club Name
        if (clubName) {
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(cardType === 'ADMIN' ? 100 : 200); // Muted color
            doc.text(clubName.toUpperCase(), contentStartX, 32);
        }

        // Devotee Name (Dynamic scaling for single-line fit)
        let fontSize = 14;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize);
        doc.setTextColor(cardType === 'ADMIN' ? 0 : 255, cardType === 'ADMIN' ? 0 : 255, cardType === 'ADMIN' ? 0 : 255);
        const nameText = (devotee.name || 'GUEST').toUpperCase();
        const maxWidth = cardWidth - contentStartX - 15;

        // Scale font down if name is too long for a single line
        while (doc.getTextWidth(nameText) > maxWidth && fontSize > 7) {
            fontSize -= 0.5;
            doc.setFontSize(fontSize);
        }
        doc.text(nameText, contentStartX, 48);

        // Fixed Badge Position
        const badgeStartY = 58;

        // Devotee Role & Gender Badge
        doc.setFillColor(255, 138, 43);
        const roleText = `${cardType} (${gender === 'M' ? 'MALE' : 'FEMALE'})`;
        const roleWidth = doc.getTextWidth(roleText) + 10;
        doc.roundedRect(contentStartX, badgeStartY, roleWidth, 10, 2, 2, 'F');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(roleText, contentStartX + roleWidth / 2, badgeStartY + 7, { align: 'center' });

        // Address
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(cardType === 'ADMIN' ? 50 : 160, cardType === 'ADMIN' ? 50 : 160, cardType === 'ADMIN' ? 50 : 160);
        const address = devotee.address || 'Address not listed';
        const splitAddress = doc.splitTextToSize(address, cardWidth - contentStartX - 20);
        doc.text(splitAddress, contentStartX, badgeStartY + 20);

        // --- Barcode Section (Moved below address) ---
        const barcodeY = badgeStartY + 20 + (splitAddress.length * 8); // Adjust Y based on address height
        const barcodePattern = generateCode128B(devotee.uid || '00000000');
        const barWidth = 0.8; // Slightly thinner to fit well
        const barHeight = 10;

        doc.setFillColor(255, 255, 255);
        doc.rect(contentStartX, barcodeY, barcodePattern.length * barWidth, barHeight, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.1);
        doc.rect(contentStartX, barcodeY, barcodePattern.length * barWidth, barHeight, 'D'); // Border for visibility on white

        doc.setFillColor(0, 0, 0);

        for (let i = 0; i < barcodePattern.length; i++) {
            if (barcodePattern[i] === '1') {
                doc.rect(contentStartX + (i * barWidth), barcodeY, barWidth, barHeight, 'F');
            }
        }

        doc.setFontSize(5);
        doc.setTextColor(cardType === 'ADMIN' ? 0 : 255, cardType === 'ADMIN' ? 0 : 255, cardType === 'ADMIN' ? 0 : 255);
        doc.text(devotee.uid || 'N/A', contentStartX + (barcodePattern.length * barWidth) / 2, barcodeY + barHeight + 5, { align: 'center' });

        // --- Bottom Info Bar ---
        const footerY = cardHeight - 20;

        doc.setFontSize(6);
        doc.setFont('courier', 'normal');
        doc.setTextColor(cardType === 'ADMIN' ? 100 : 120);
        doc.text('UID NO.', contentStartX, footerY);
        doc.text('VALIDITY', cardWidth - 20, footerY, { align: 'right' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 20); // Very dark for footer info
        doc.text(devotee.uid || 'N/A', contentStartX, footerY + 10);

        const validityText = `${validFrom} - ${validUpto}`;
        doc.setFontSize(validityText.length > 15 ? 6 : 8); // Scale down if too long
        doc.text(validityText, cardWidth - 20, footerY + 10, { align: 'right' });

        const cleanName = devotee.name.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanFestivalName = festivalName.replace(/[^a-zA-Z0-9]/g, '_');
        doc.save(`${cleanFestivalName}_ATM_${cleanName}.pdf`);
        return true;
    } catch (error) {
        console.error("Export Devotee Card PDF error:", error);
        return false;
    }
};

