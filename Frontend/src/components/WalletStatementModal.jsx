import React, { useState } from 'react';
import { X, FileText, Download, FileJson } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function WalletStatementModal({ isOpen, onClose, transactions }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statement, setStatement] = useState(null);

    if (!isOpen) return null;

    const generateStatement = () => {
        if (!startDate || !endDate) return;

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
        if (!statement) return;

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

        csvContent += `\nOpening Balance,,,,${statement.openingBalance.toFixed(2)}\n`;
        csvContent += `Total Credits,,,,+${statement.totalCredits.toFixed(2)}\n`;
        csvContent += `Total Debits,,,,-${statement.totalDebits.toFixed(2)}\n`;
        csvContent += `Closing Balance,,,,${statement.closingBalance.toFixed(2)}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `zellet_statement_${format(start, 'yyyyMMdd')}_${format(end, 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadPDF = () => {
        if (!statement) return;

        const doc = new jsPDF();
        const start = startOfDay(new Date(startDate));
        const end = endOfDay(new Date(endDate));

        const filteredTx = transactions
            .filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= start && txDate <= end;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        doc.setFontSize(20);
        doc.text("Zellet Wallet Statement", 14, 22);

        doc.setFontSize(11);
        doc.text(`Period: ${format(start, 'MMM dd, yyyy')} to ${format(end, 'MMM dd, yyyy')}`, 14, 30);

        doc.autoTable({
            startY: 40,
            head: [['Date', 'Type', 'Amount (INR)']],
            body: filteredTx.map(tx => {
                const dateStr = format(new Date(tx.date), 'MMM dd, yyyy HH:mm');
                const isCredit = ['Credit', 'Voucher Credit'].includes(tx.type);
                const prefix = isCredit ? '+' : '-';
                return [dateStr, tx.type, `${prefix}Rs. ${Math.abs(tx.amount).toFixed(2)}`];
            }),
        });

        const finalY = doc.lastAutoTable.finalY || 40;

        doc.setFontSize(12);
        doc.text(`Opening Balance: Rs. ${statement.openingBalance.toFixed(2)}`, 14, finalY + 10);
        doc.text(`Total Credits: + Rs. ${statement.totalCredits.toFixed(2)}`, 14, finalY + 18);
        doc.text(`Total Debits: - Rs. ${statement.totalDebits.toFixed(2)}`, 14, finalY + 26);
        doc.setFont(undefined, 'bold');
        doc.text(`Closing Balance: Rs. ${statement.closingBalance.toFixed(2)}`, 14, finalY + 36);

        doc.save(`zellet_statement_${format(start, 'yyyyMMdd')}_${format(end, 'yyyyMMdd')}.pdf`);
    };

    return (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 relative shadow-2xl">
                <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 transition-colors">
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-brand-primary" /> Wallet Statement
                    </h2>
                    <p className="text-gray-500 font-medium text-sm">Select dates to view your statement.</p>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-primary/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-primary/20 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        onClick={generateStatement}
                        disabled={!startDate || !endDate}
                        className="w-full py-3 bg-brand-dark text-white font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Generate Statement
                    </button>
                </div>
                {statement && (
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                            Statement for {format(statement.startDate, 'MMM dd, yyyy')} - {format(statement.endDate, 'MMM dd, yyyy')}
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center text-gray-600">
                                <span>Opening Balance:</span>
                                <span className="font-medium">₹{statement.openingBalance.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-600">
                                <span>Total Credits:</span>
                                <span className="font-medium">+₹{statement.totalCredits.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-900">
                                <span>Total Debits:</span>
                                <span className="font-medium">-₹{statement.totalDebits.toFixed(2)}</span>
                            </div>
                            <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between items-center font-bold text-lg text-brand-dark">
                                <span>Closing Balance:</span>
                                <span>₹{statement.closingBalance.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button onClick={downloadPDF} className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold rounded-xl hover:bg-emerald-100 transition-colors flex justify-center items-center gap-2 text-sm">
                                <Download className="w-4 h-4" /> Save PDF
                            </button>
                            <button onClick={downloadCSV} className="flex-1 py-2.5 bg-blue-50 text-blue-700 border border-blue-100 font-bold rounded-xl hover:bg-blue-100 transition-colors flex justify-center items-center gap-2 text-sm">
                                <FileJson className="w-4 h-4" /> Save CSV
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
