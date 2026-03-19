import React, { useState } from 'react';
import { X, FileText, Download, FileJson } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function WalletStatementModal({ isOpen, onClose, transactions }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statement, setStatement] = useState(null);

    if (!isOpen) return null;

    // Automatically generate statement when dates are selected
    React.useEffect(() => {
        if (startDate && endDate) {
            generateStatement();
        }
    }, [startDate, endDate, transactions]);

    const generateStatement = () => {
        const start = startOfDay(new Date(startDate));
        const end = endOfDay(new Date(endDate));

        // Sort ascending by date for chronological calculation
        const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

        let openingBalance = 0;
        let totalCredits = 0;
        let totalDebits = 0;

        sortedTx.forEach(tx => {
            const txDate = new Date(tx.date);
            const amount = Math.abs(tx.amount);
            const isCredit = ['Credit', 'Voucher Credit'].includes(tx.type);

            if (isBefore(txDate, start)) {
                if (isCredit) openingBalance += amount;
                else openingBalance -= amount;
            } else if (txDate >= start && txDate <= end) {
                if (isCredit) totalCredits += amount;
                else totalDebits -= amount;
            }
        });

        setStatement({
            openingBalance,
            totalCredits,
            totalDebits: Math.abs(totalDebits),
            closingBalance: openingBalance + totalCredits - Math.abs(totalDebits),
            startDate: start,
            endDate: end,
        });
    };

    const downloadCSV = () => {
        if (!startDate || !endDate) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Description,Type,Amount (INR)\n";

        const start = startOfDay(new Date(startDate));
        const end = endOfDay(new Date(endDate));

        const filteredTx = transactions
            .filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= start && txDate <= end;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        filteredTx.forEach(tx => {
            const dateStr = format(new Date(tx.date), 'yyyy-MM-dd HH:mm:ss');
            const isCredit = ['Credit', 'Voucher Credit'].includes(tx.type);
            const prefix = isCredit ? '+' : '-';
            csvContent += `"${dateStr}","${tx.type}","${tx.type}","${prefix}${Math.abs(tx.amount).toFixed(2)}"\n`;
        });

        if (statement) {
            csvContent += `\nOpening Balance,,,,${statement.openingBalance.toFixed(2)}\n`;
            csvContent += `Total Credits,,,,+${statement.totalCredits.toFixed(2)}\n`;
            csvContent += `Total Debits,,,,-${statement.totalDebits.toFixed(2)}\n`;
            csvContent += `Closing Balance,,,,${statement.closingBalance.toFixed(2)}\n`;
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `zellet_statement_${format(start, 'yyyyMMdd')}_${format(end, 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadPDF = () => {
        try {
            if (!startDate || !endDate || !statement) return;

            const doc = new jsPDF();
            const start = startOfDay(new Date(startDate));
            const end = endOfDay(new Date(endDate));

            const filteredTx = transactions
                .filter(tx => {
                    const txDate = new Date(tx.date);
                    return txDate >= start && txDate <= end;
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            // Header Branding
            doc.setFillColor(15, 23, 42); // Indigo 900
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(28);
            doc.setFont(undefined, 'bold');
            doc.text("Zellet.", 14, 25);
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text("DIGITAL LEDGER STATEMENT", 14, 32);
            
            doc.setTextColor(200, 200, 200);
            doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 140, 25);

            // Period Info
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text("Transaction Summary Period", 14, 50);
            doc.setFont(undefined, 'normal');
            doc.text(`${format(start, 'MMMM dd, yyyy')} — ${format(end, 'MMMM dd, yyyy')}`, 14, 56);

            // Summary Statistics
            doc.setDrawColor(241, 245, 249);
            doc.setFillColor(248, 250, 252);
            doc.rect(14, 65, 182, 30, 'FD');
            
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text("OPENING", 20, 75);
            doc.text("CREDITS", 70, 75);
            doc.text("DEBITS", 120, 75);
            doc.text("CLOSING", 165, 75);

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`Rs. ${statement.openingBalance.toFixed(2)}`, 20, 85);
            doc.setTextColor(16, 185, 129); // Emerald 500
            doc.text(`+${statement.totalCredits.toFixed(2)}`, 70, 85);
            doc.setTextColor(239, 68, 68); // Red 500
            doc.text(`-${statement.totalDebits.toFixed(2)}`, 120, 85);
            doc.setTextColor(79, 70, 229); // Indigo 600
            doc.text(`Rs. ${statement.closingBalance.toFixed(2)}`, 165, 85);

            // Transaction Table
            autoTable(doc, {
                startY: 105,
                head: [['Date', 'Description', 'Categorization', 'Amount']],
                body: filteredTx.map(tx => {
                    const dateStr = format(new Date(tx.date), 'MMM dd, yyyy');
                    const timeStr = format(new Date(tx.date), 'HH:mm');
                    const isCredit = ['Credit', 'Voucher Credit'].includes(tx.type);
                    const prefix = isCredit ? '+' : '-';
                    return [
                        `${dateStr}\n${timeStr}`,
                        tx.type,
                        tx.type === 'Transfer' ? 'P2P Transfer' : (tx.type === 'Voucher Credit' ? 'Redemption' : 'Manual Adjustment'),
                        { content: `${prefix} ${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { textColor: isCredit ? [16, 185, 129] : [30, 41, 59], fontStyle: 'bold' } }
                    ];
                }),
            headStyles: { fillColor: [15, 23, 42], fontSize: 10, cellPadding: 4 },
            bodyStyles: { fontSize: 9, cellPadding: 4 },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { left: 14, right: 14 }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Zellet Financial Services — Page ${i} of ${pageCount}`, 14, 285);
            doc.text("This is a computer-generated statement and does not require a signature.", 110, 285);
        }

            doc.save(`Zellet_Statement_${format(start, 'yyyyMMdd')}.pdf`);
        } catch (err) {
            console.error("PDF Generation Error:", err);
            alert("Error generating PDF statement. " + err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3.5rem] w-full max-w-lg p-12 relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 ease-premium overflow-hidden">
                
                {/* Modal Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                
                <button onClick={onClose} className="absolute top-10 right-10 w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90">
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <FileText className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-4xl font-black text-[#0F172A] mb-4 tracking-tightest leading-none">
                        Ledger Statement<span className="text-indigo-600">.</span>
                    </h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest max-w-[80%] mx-auto">
                        Filter and export your cryptographically verified transaction history for any duration.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-2">Epoch Start</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-bold text-sm transition-all"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-2">Epoch End</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none font-bold text-sm transition-all"
                        />
                    </div>
                </div>

                {statement ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Summary Visualization */}
                        <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            
                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opening Snapshot</span>
                                    <span className="text-lg font-black text-[#0F172A] tracking-tight">₹{statement.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-emerald-600">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Total Ingress</span>
                                        <span className="text-sm font-bold">+₹{statement.totalCredits.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-500">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Total Egress</span>
                                        <span className="text-sm font-bold">-₹{statement.totalDebits.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="pt-6 mt-6 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Net Closing</span>
                                    <span className="text-2xl font-black text-[#0F172A] tracking-tightest">₹{statement.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Export Protocols */}
                        <div className="grid grid-cols-2 gap-5">
                            <button 
                                onClick={downloadPDF} 
                                className="group relative py-6 bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] rounded-[2rem] hover:bg-blue-700 transition-all duration-500 flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] active:scale-95 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                <Download className="w-5 h-5 group-hover:bounce transition-transform" />
                                Save PDF
                            </button>
                            <button 
                                onClick={downloadCSV} 
                                className="py-6 bg-slate-100 text-slate-600 border border-slate-200 font-black uppercase tracking-widest text-[11px] rounded-[2rem] hover:bg-slate-200 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95"
                            >
                                <FileJson className="w-5 h-5" />
                                Save CSV
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 opacity-30">
                        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Select timestamps to compute parity...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
