import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Users, Ticket, Activity, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function Admin() {
    const { getAllData, createVoucher, logout, currentUser } = useWallet();
    const navigate = useNavigate();
    const { users, wallets, transactions, vouchers } = getAllData();

    const [code, setCode] = useState('');
    const [amount, setAmount] = useState('');
    const [expiry, setExpiry] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleCreateVoucher = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            if (!code || !amount || !expiry) throw new Error("All fields are required");
            createVoucher(code.toUpperCase(), amount, expiry);
            setSuccess("Voucher successfully created");
            setCode('');
            setAmount('');
            setExpiry('');
        } catch (err) {
            setError(err.message);
        }
    };

    const totalBalance = wallets.reduce((acc, curr) => acc + curr.balance, 0);

    return (
        <div className="min-h-screen bg-brand-light font-sans text-brand-dark pb-20">
            {/* Admin Navbar */}
            <nav className="bg-brand-dark text-white px-6 py-4 flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-brand-secondary" />
                    <span className="text-xl font-bold">Zellet Admin</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{currentUser?.email}</span>
                    <button
                        onClick={() => { logout(); navigate('/'); }}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* System Stats Map */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Users</p>
                            <h3 className="text-2xl font-bold">{users.length}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Platform Balance</p>
                            <h3 className="text-2xl font-bold">${totalBalance.toFixed(2)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Txns</p>
                            <h3 className="text-2xl font-bold">{transactions.length}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
                            <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Vouchers</p>
                            <h3 className="text-2xl font-bold">{vouchers.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Create Voucher Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-brand-primary" /> Create Voucher
                            </h3>

                            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
                            {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm border border-emerald-100">{success}</div>}

                            <form onSubmit={handleCreateVoucher} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                    <input type="text" value={code} onChange={e => setCode(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 uppercase font-mono text-sm" placeholder="SUMMER50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200" placeholder="50.00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                    <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200" />
                                </div>
                                <button type="submit" className="w-full py-3 bg-brand-dark text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">Generate Voucher</button>
                            </form>
                        </div>
                    </div>

                    {/* Users and Vouchers lists */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold mb-4">Active Vouchers</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                            <th className="pb-3 font-medium">Code</th>
                                            <th className="pb-3 font-medium">Amount</th>
                                            <th className="pb-3 font-medium">Expiry</th>
                                            <th className="pb-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {vouchers.map(v => (
                                            <tr key={v.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                <td className="py-4 font-mono font-medium">{v.code}</td>
                                                <td className="py-4">${v.amount.toFixed(2)}</td>
                                                <td className="py-4">{format(new Date(v.expiry), 'MMM dd, yyyy')}</td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${v.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                                        v.status === 'Used' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {v.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {vouchers.length === 0 && (
                                            <tr><td colSpan="4" className="py-4 text-center text-gray-400">No vouchers generated.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold mb-4">Registered Users</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                            <th className="pb-3 font-medium">Name</th>
                                            <th className="pb-3 font-medium">Email</th>
                                            <th className="pb-3 font-medium">Role</th>
                                            <th className="pb-3 font-medium">Wallet ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {users.map(u => (
                                            <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                <td className="py-4 font-medium">{u.name}</td>
                                                <td className="py-4 text-gray-600">{u.email}</td>
                                                <td className="py-4">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
                                                        {u.role || 'user'}
                                                    </span>
                                                </td>
                                                <td className="py-4 font-mono text-gray-400 text-xs">{u.wallet_id.substring(0, 12)}...</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
