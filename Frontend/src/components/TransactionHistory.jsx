import React from 'react';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, Gift } from 'lucide-react';

export default function TransactionHistory({ transactions, compact = false }) {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <span className="text-xl">📊</span>
                </div>
                <p className="text-gray-500 font-medium font-heading">No transactions yet.</p>
                <p className="text-sm text-gray-400 mt-1">Your activity will appear right here.</p>
            </div>
        );
    }

    const displayTx = compact ? transactions.slice(0, 5) : transactions;

    const getIconAndColor = (type, amountStr) => {
        if (type === 'Voucher Credit') {
            return { icon: Gift, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' };
        }
        const isCredit = ['Credit', 'Voucher Credit'].includes(type) || (type === 'Transfer' && amountStr.startsWith('+'));
        if (isCredit) {
            return { icon: ArrowDownLeft, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
        }
        return { icon: ArrowUpRight, color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-200' };
    };

    return (
        <div className="space-y-3">
            {displayTx.map((tx) => {
                const formattedAmount = `₹${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                const isPositive = ['Credit', 'Voucher Credit'].includes(tx.type);

                const { icon: Icon, color, bg, border } = getIconAndColor(tx.type, isPositive ? '+' : '-');

                // Extract date and time for the new structure
                const txDate = new Date(tx.date);
                const date = format(txDate, 'MMM dd, yyyy');
                const time = format(txDate, 'hh:mm a');
                const title = tx.type; // Assuming tx.type can serve as the title

                return (
                    <div key={tx.id} className="group flex items-center justify-between py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-2 rounded-xl transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${bg} ${border} group-hover:scale-105 transition-transform`}>
                                    <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                            </div>
                            <div>
                                <p className="font-heading font-bold text-gray-900">{title}</p>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">{date} • {time}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`font-heading font-extrabold ${isPositive ? 'text-emerald-500' : 'text-gray-900'}`}>
                                {isPositive ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">{tx.type}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
