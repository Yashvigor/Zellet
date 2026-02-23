import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const COLORS_CASHFLOW = ['#10b981', '#f43f5e']; // emerald (in), rose (out)
const COLORS_INCOMING = ['#3b82f6', '#ec4899']; // blue (transfer), pink (voucher)

export default function AnalyticsDashboard({ transactions }) {
    // 1. Credit vs Debit
    const creditDebitData = useMemo(() => {
        let credit = 0;
        let debit = 0;
        transactions.forEach(tx => {
            if (tx.type === 'Credit' || tx.type === 'Voucher Credit') credit += Math.abs(tx.amount);
            else if (tx.type === 'Debit') debit += Math.abs(tx.amount);
        });
        return [
            { name: 'Incoming', value: credit },
            { name: 'Outgoing', value: debit }
        ].filter(d => d.value > 0);
    }, [transactions]);

    // 2. Incoming Breakdown (Vouchers vs Transfers)
    const incomingData = useMemo(() => {
        let transfers = 0;
        let vouchers = 0;
        transactions.forEach(tx => {
            if (tx.type === 'Credit') transfers += Math.abs(tx.amount);
            if (tx.type === 'Voucher Credit') vouchers += Math.abs(tx.amount);
        });
        return [
            { name: 'Received Links', value: transfers },
            { name: 'Promo Vouchers', value: vouchers }
        ].filter(d => d.value > 0);
    }, [transactions]);

    // 3. 30-Day Spend
    const dailySpendData = useMemo(() => {
        const last30Days = Array.from({ length: 30 }).map((_, i) => {
            const date = subDays(new Date(), 29 - i);
            return {
                day: format(date, 'MMM dd'),
                start: startOfDay(date),
                end: endOfDay(date),
                spend: 0
            };
        });

        transactions.forEach(tx => {
            if (tx.type === 'Debit') {
                const txDate = new Date(tx.date);
                const dayBucket = last30Days.find(d => txDate >= d.start && txDate <= d.end);
                if (dayBucket) dayBucket.spend += Math.abs(tx.amount);
            }
        });

        return last30Days.map(d => ({ name: d.day, spend: Number(d.spend.toFixed(2)) }));
    }, [transactions]);

    return (
        <div className="mt-8 space-y-6 animate-in fade-in duration-500">
            <h3 className="text-xl font-heading font-bold text-gray-900">Analytics & Insights</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Spend Analysis */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">30-Day Spend Trend</h4>
                    <div className="h-64 mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailySpendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `₹${val}`} />
                                <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="spend" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorSpend)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Charts Stack */}
                <div className="flex flex-col gap-6">
                    {/* Cash Flow */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex-1 flex flex-col">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Cash Flow</h4>
                        {creditDebitData.length > 0 ? (
                            <div className="h-40 w-full mt-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={creditDebitData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                                            {creditDebitData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS_CASHFLOW[index % COLORS_CASHFLOW.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-gray-400 text-sm mt-auto">No transaction data yet.</div>
                        )}
                    </div>

                    {/* Incoming Breakdown */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex-1 flex flex-col">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Incoming Breakdown</h4>
                        {incomingData.length > 0 ? (
                            <div className="h-40 w-full mt-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={incomingData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                                            {incomingData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS_INCOMING[index % COLORS_INCOMING.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-gray-400 text-sm mt-auto">No incoming data yet.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
