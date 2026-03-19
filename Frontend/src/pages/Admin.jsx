import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Users, Ticket, Activity, Plus, Settings, Lock, Unlock, X, ArrowDownLeft, ArrowUpRight, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { format } from 'date-fns';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { text: 'Good morning', icon: Sunrise, color: 'text-amber-500' };
    if (hour < 12) return { text: 'Good morning', icon: Sun, color: 'text-orange-500' };
    if (hour < 18) return { text: 'Good afternoon', icon: Sun, color: 'text-amber-500' };
    if (hour < 22) return { text: 'Good evening', icon: Sunset, color: 'text-indigo-400' };
    return { text: 'Good night', icon: Moon, color: 'text-slate-400' };
};

export default function Admin() {
    const { getAllData, createVoucher, logout, currentUser, updateUserTier, updateWalletStatus, adjustWalletBalance } = useWallet();
    const navigate = useNavigate();
    const { users, wallets, transactions, vouchers, logs } = getAllData();

    // User Management Modal State
    const [selectedUser, setSelectedUser] = useState(null);
    const [tierEdit, setTierEdit] = useState('');
    const [adjustState, setAdjustState] = useState(null); // { walletId, type: 'Credit'|'Debit', amount: '' }
    const [loadingAction, setLoadingAction] = useState(false);

    const [code, setCode] = useState('');
    const [amount, setAmount] = useState('');
    const [expiry, setExpiry] = useState('');
    const [minBalance, setMinBalance] = useState('0');
    const [eventCategory, setEventCategory] = useState('None');
    const [maxUses, setMaxUses] = useState('1000');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleCreateVoucher = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            if (!code || !amount || !expiry) throw new Error("Code, amount, and expiry are required");
            createVoucher(code.toUpperCase(), parseFloat(amount), expiry, parseFloat(minBalance), eventCategory, parseInt(maxUses));
            setSuccess("Voucher successfully created");
            setCode('');
            setAmount('');
            setExpiry('');
            setMinBalance('0');
            setEventCategory('None');
            setMaxUses('1000');
        } catch (err) {
            setError(err.message);
        }
    };

    const totalBalance = (wallets || []).reduce((acc, curr) => acc + parseFloat(curr.balance || 0), 0);

    const getUserStats = (userId) => {
        let sent = 0;
        let received = 0;
        (transactions || []).forEach(tx => {
            if (tx.sender_id === userId) sent += parseFloat(tx.amount || 0);
            if (tx.receiver_id === userId) received += parseFloat(tx.amount || 0);
        });
        return { sent, received };
    };

    return (
        <div className="min-h-screen bg-brand-light font-sans text-brand-dark pb-20">
            {/* Admin Navbar */}
            <nav className="bg-brand-dark text-white px-6 py-4 flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-brand-secondary" />
                    <span className="text-xl font-bold">Zellet Admin</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-sm font-medium hover:text-brand-secondary transition-colors mr-4"
                    >
                        Back to Dashboard
                    </button>
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

                {/* Management Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-xl bg-white shadow-sm border border-gray-100 ${getGreeting().color}`}>
                            {React.createElement(getGreeting().icon, { className: "w-4 h-4" })}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{getGreeting().text}, Admin</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Overview & Control</h1>
                    <p className="text-sm text-gray-500 mt-1">Managing {users.length} active nodes across the network</p>
                </div>

                {/* System Stats Map */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Users</p>
                            <h3 className="text-xl font-bold">{users.length}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Balance</p>
                            <h3 className="text-xl font-bold">₹{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Transfers</p>
                            <h3 className="text-xl font-bold">{transactions.length}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center shrink-0">
                            <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Vouchers</p>
                            <h3 className="text-xl font-bold">{vouchers.length}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Audit Logs</p>
                            <h3 className="text-xl font-bold">{logs?.length || 0}</h3>
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
                                    <input type="text" value={code} onChange={e => setCode(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 uppercase font-mono text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                        <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200" />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Advanced Rules</h4>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                                                <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200" min="1" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Min Balance (₹)</label>
                                                <input type="number" value={minBalance} onChange={e => setMinBalance(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200" min="0" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Category</label>
                                            <select value={eventCategory} onChange={e => setEventCategory(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white">
                                                <option value="None">None</option>
                                                <option value="First Transaction">First Transaction</option>
                                                <option value="Festival">Festival</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-3 bg-brand-dark text-white rounded-xl font-bold hover:bg-gray-800 transition-colors mt-4">Generate Voucher</button>
                            </form>
                        </div>
                    </div>

                    {/* Users and Vouchers lists */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Analytics Panel */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
                            <div className="flex-1 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center">
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Conversion Rate</p>
                                <h4 className="text-3xl font-bold text-brand-dark">
                                    {vouchers?.length > 0 ? ((vouchers.reduce((acc, v) => acc + parseInt(v.used_count || 0), 0) / vouchers.reduce((acc, v) => acc + parseInt(v.max_uses || 1), 0)) * 100).toFixed(1) : 0}%
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">Total uses vs max limits</p>
                            </div>
                            <div className="flex-1 bg-red-50/50 p-4 rounded-xl border border-red-100 flex flex-col justify-center">
                                <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Expiry Loss</p>
                                <h4 className="text-3xl font-bold text-brand-dark">
                                    {vouchers.filter(v => v.status === 'Expired').reduce((acc, v) => acc + (v.max_uses - v.used_count), 0)}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">Unused redemptions lost</p>
                            </div>
                            <div className="flex-1 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center">
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Most Used</p>
                                <h4 className="text-lg font-bold text-brand-dark font-mono truncate">
                                    {vouchers.length > 0 ? [...vouchers].sort((a, b) => (b.used_count || 0) - (a.used_count || 0))[0]?.code || 'N/A' : 'N/A'}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">Top performing code</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Voucher Usage Reports</h3>
                                <div className="text-xs font-medium text-gray-500 space-x-3">
                                    <span className="text-emerald-600">Active: {vouchers.filter(v => v.status === 'Active').length}</span>
                                    <span className="text-blue-600">Depleted: {vouchers.filter(v => v.status === 'Used').length}</span>
                                    <span className="text-red-600">Expired: {vouchers.filter(v => v.status === 'Expired').length}</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                            <th className="pb-3 font-medium">Code</th>
                                            <th className="pb-3 font-medium">Amount</th>
                                            <th className="pb-3 font-medium text-center">Uses</th>
                                            <th className="pb-3 font-medium">Expiry</th>
                                            <th className="pb-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {vouchers.map(v => (
                                            <tr key={v.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                <td className="py-4 font-mono font-medium">{v.code} <br /><span className="text-[10px] text-gray-400">Min: ₹{parseFloat(v.min_balance || 0).toFixed(2)}</span></td>
                                                <td className="py-4 font-medium text-emerald-600">₹{parseFloat(v.amount || 0).toFixed(2)}</td>
                                                <td className="py-4 text-center">
                                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono text-xs font-bold">{v.used_count}/{v.max_uses}</span>
                                                </td>
                                                <td className="py-4 text-gray-500 whitespace-nowrap">{format(new Date(v.expiry), 'MMM dd, yyyy')}</td>
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
                                            <th className="pb-3 font-medium">Tier</th>
                                            <th className="pb-3 font-medium text-right">Sent</th>
                                            <th className="pb-3 font-medium text-right">Received</th>
                                            <th className="pb-3 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {users.map(u => {
                                            const stats = getUserStats(u.id);
                                            return (
                                                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                    <td className="py-4 font-medium">{u.name} <br /><span className="text-xs text-brand-primary">{u.role === 'admin' ? 'Admin' : ''}</span></td>
                                                    <td className="py-4 text-gray-600">{u.email}</td>
                                                    <td className="py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.tier === 'Platinum' ? 'bg-indigo-100 text-indigo-700' :
                                                            u.tier === 'Gold' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {u.tier || 'Silver'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right text-gray-500 font-medium">₹{stats.sent.toFixed(2)}</td>
                                                    <td className="py-4 text-right text-emerald-600 font-medium">+₹{stats.received.toFixed(2)}</td>
                                                    <td className="py-4 text-right">
                                                        <button
                                                            onClick={() => { setSelectedUser(u); setTierEdit(u.tier || 'Silver'); setAdjustState(null); }}
                                                            className="p-1.5 bg-gray-50 hover:bg-brand-primary hover:text-white text-gray-500 rounded-lg transition-colors border border-gray-200"
                                                            title="Manage User"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Activity Logs Table */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Activity Logs & Audit Trail</h3>
                            </div>
                            <div className="overflow-x-auto max-h-[500px]">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                                        <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                            <th className="pb-3 font-medium">Timestamp</th>
                                            <th className="pb-3 font-medium">Action Type</th>
                                            <th className="pb-3 font-medium">User ID</th>
                                            <th className="pb-3 font-medium">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {[...(logs || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(log => (
                                            <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                <td className="py-4 text-gray-500 whitespace-nowrap">{format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}</td>
                                                <td className="py-4">
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                                        {log.action_type}
                                                    </span>
                                                </td>
                                                <td className="py-4 font-mono text-xs text-gray-500" title={log.user_id}>{log.user_id.substring(0, 8)}...</td>
                                                <td className="py-4 text-gray-700">{log.description}</td>
                                            </tr>
                                        ))}
                                        {(!logs || logs.length === 0) && (
                                            <tr><td colSpan="4" className="py-8 text-center text-gray-400">No activity logs recorded yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {/* User Management Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 transition-colors">
                            <X className="w-4 h-4" />
                        </button>

                        <div className="mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Manage User: {selectedUser.name}</h2>
                            <p className="text-sm text-gray-500 font-medium">{selectedUser.email}</p>
                        </div>

                        {/* Tier Management */}
                        <div className="mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest">Account Tier</h3>
                            <div className="flex items-center gap-4">
                                <select
                                    value={tierEdit}
                                    onChange={(e) => setTierEdit(e.target.value)}
                                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium focus:ring-2 focus:ring-brand-primary/20 outline-none"
                                >
                                    <option value="Silver">Silver</option>
                                    <option value="Gold">Gold</option>
                                    <option value="Platinum">Platinum</option>
                                </select>
                                <button
                                    disabled={loadingAction || tierEdit === selectedUser.tier}
                                    onClick={async () => {
                                        setLoadingAction(true);
                                        try { await updateUserTier(selectedUser.id, tierEdit); setSuccess('Tier updated'); setTimeout(() => setSuccess(''), 2000); }
                                        catch (e) { setError(e.message); setTimeout(() => setError(''), 2000); }
                                        setLoadingAction(false);
                                    }}
                                    className="px-4 py-2 bg-brand-dark text-white rounded-xl font-bold disabled:opacity-50 hover:bg-gray-800 transition-colors"
                                >
                                    Update Tier
                                </button>
                            </div>
                        </div>

                        {/* Wallet Management */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest">Wallets & Funds</h3>
                            <div className="space-y-4">
                                {wallets.filter(w => w.user_id === selectedUser.id).map(w => (
                                    <div key={w.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-brand-dark">{w.wallet_type} Wallet</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${w.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {w.status}
                                                </span>
                                            </div>
                                            <p className="text-xl font-mono font-bold text-gray-700">
                                                {w.wallet_type === 'Reward' ? `${w.balance} PTS` : `₹${parseFloat(w.balance).toFixed(2)}`}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <button
                                                disabled={loadingAction}
                                                onClick={async () => {
                                                    setLoadingAction(true);
                                                    const newStatus = w.status === 'Active' ? 'Frozen' : 'Active';
                                                    try { await updateWalletStatus(w.id, newStatus); setSuccess('Status updated'); setTimeout(() => setSuccess(''), 2000); }
                                                    catch (e) { setError(e.message); setTimeout(() => setError(''), 2000); }
                                                    setLoadingAction(false);
                                                }}
                                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-bold transition-colors border ${w.status === 'Active' ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                                    }`}
                                            >
                                                {w.status === 'Active' ? <><Lock className="w-4 h-4" /> Freeze</> : <><Unlock className="w-4 h-4" /> Unfreeze</>}
                                            </button>

                                            <button
                                                onClick={() => setAdjustState({ walletId: w.id, type: 'Credit', amount: '', walletType: w.wallet_type, currentBalance: w.balance })}
                                                className="flex-1 sm:flex-none px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 rounded-xl text-sm font-bold transition-colors"
                                            >
                                                Adjust
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Adjustment Form Sub-panel */}
                        {adjustState && (
                            <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-2xl p-5 animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-brand-dark">Adjust {adjustState.walletType} Balance</h4>
                                    <button onClick={() => setAdjustState(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <button
                                        onClick={() => setAdjustState({ ...adjustState, type: 'Credit' })}
                                        className={`py-2 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${adjustState.type === 'Credit' ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-500'}`}
                                    >
                                        <ArrowDownLeft className="w-4 h-4" /> Credit (Add)
                                    </button>
                                    <button
                                        onClick={() => setAdjustState({ ...adjustState, type: 'Debit' })}
                                        className={`py-2 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${adjustState.type === 'Debit' ? 'bg-red-100 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-500'}`}
                                    >
                                        <ArrowUpRight className="w-4 h-4" /> Debit (Remove)
                                    </button>
                                </div>
                                <div className="flex items-end gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Amount</label>
                                        <input
                                            type="number"
                                            value={adjustState.amount}
                                            onChange={e => setAdjustState({ ...adjustState, amount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                                            min="0"
                                        />
                                    </div>
                                    <button
                                        disabled={loadingAction || !adjustState.amount || adjustState.amount <= 0}
                                        onClick={async () => {
                                            if (adjustState.type === 'Debit' && parseFloat(adjustState.amount) > parseFloat(adjustState.currentBalance)) {
                                                setError('Debit amount exceeds current wallet balance');
                                                setTimeout(() => setError(''), 3000);
                                                return;
                                            }
                                            setLoadingAction(true);
                                            try { await adjustWalletBalance(adjustState.walletId, adjustState.amount, adjustState.type); setSuccess('Balance adjusted'); setAdjustState(null); setTimeout(() => setSuccess(''), 2000); }
                                            catch (e) { setError(e.message); setTimeout(() => setError(''), 3000); }
                                            setLoadingAction(false);
                                        }}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}
