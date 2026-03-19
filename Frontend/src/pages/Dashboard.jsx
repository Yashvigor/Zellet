import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import { Wallet, LogOut, Plus, Send, Gift, History, X, ArrowUpRight, ArrowDownLeft, ShieldCheck, ChevronRight } from 'lucide-react';
import TransactionHistory from '../components/TransactionHistory';
import WalletStatementModal from '../components/WalletStatementModal';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import logo from '../assets/logo.png';

import { Sun, Moon, Sunrise, Sunset } from 'lucide-react';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { text: 'Good morning', icon: Sunrise, color: 'text-amber-500' };
    if (hour < 12) return { text: 'Good morning', icon: Sun, color: 'text-orange-500' };
    if (hour < 18) return { text: 'Good afternoon', icon: Sun, color: 'text-amber-500' };
    if (hour < 22) return { text: 'Good evening', icon: Sunset, color: 'text-indigo-400' };
    return { text: 'Good night', icon: Moon, color: 'text-slate-400' };
};

export default function Dashboard() {
    const { currentUser, wallet, wallets, rewardBalance, logout, addMoney, sendMoney, applyVoucher, convertPoints, internalTransfer, getUserTransactions } = useWallet();
    const navigate = useNavigate();

    const [activeModal, setActiveModal] = useState(null); // 'add', 'send', 'voucher', 'statement', 'internal'
    const [amount, setAmount] = useState('');
    const [receiverEmail, setReceiverEmail] = useState('');
    const [voucherCode, setVoucherCode] = useState('');
    const [fromWallet, setFromWallet] = useState('Main');
    const [toWallet, setToWallet] = useState('Savings');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const transactions = getUserTransactions(currentUser?.id);

    const mappedTransactions = transactions.map(tx => {
        if (tx.type === 'Transfer') {
            const isReceiver = tx.receiver_id === currentUser.id;
            return { ...tx, type: isReceiver ? 'Credit' : 'Debit' };
        }
        return tx;
    });

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const closeModal = () => {
        setActiveModal(null);
        setAmount('');
        setReceiverEmail('');
        setVoucherCode('');
        setError('');
        setSuccess('');
    };

    const handleAction = async (actionFn) => {
        setError('');
        setSuccess('');
        try {
            await actionFn();
            setSuccess('Transaction successful!');
            setTimeout(() => closeModal(), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B] pb-20">
            {/* Admin Header */}
            {currentUser?.role === 'admin' && (
                <div className="bg-[#0F172A] text-white px-8 py-3 flex justify-between items-center sticky top-0 z-[60]">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-300">Admin Panel</span>
                    </div>
                    <button onClick={() => navigate('/admin')} className="text-xs font-bold bg-white text-black px-4 py-1.5 rounded-full hover:bg-slate-200 transition-colors uppercase tracking-widest">Manage Unit</button>
                </div>
            )}

            {/* Navigation */}
            <nav className="bg-white border-b border-slate-100 px-10 py-5 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <img src={logo} alt="Zellet" className="w-10 h-10 object-contain" />
                    <span className="text-2xl font-black text-[#0F172A] tracking-tighter">Zellet</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-sm font-black text-[#0F172A]">{currentUser?.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentUser?.tier} Member</span>
                    </div>
                    <button onClick={handleLogout} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95 group">
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-12 items-start">

                    {/* Left - Balance & Actions */}
                    <div className="w-full lg:w-[62%] space-y-12">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-100 ${getGreeting().color}`}>
                                    {React.createElement(getGreeting().icon, { className: "w-4 h-4" })}
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">{getGreeting().text}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-[#0F172A] tracking-tightest leading-tight">
                                Back for more, {currentUser?.name.split(' ')[0]}?
                                <span className="text-indigo-600 inline-block ml-2 animate-pulse">.</span>
                            </h1>
                        </div>

                        {/* Balance Card - Professional Minimalist */}
                        <div className="relative">
                            <div className="relative overflow-hidden rounded-[2.5rem] p-8 text-white bg-slate-900 min-h-[220px] flex flex-col justify-between shadow-2xl shadow-slate-200">
                                <div className="relative z-10 space-y-1">
                                    <p className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase">Total Account Balance</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-bold text-slate-500 tracking-tighter mb-0.5">₹</span>
                                        <h2 className="text-4xl md:text-5xl font-black tracking-tightest leading-none">
                                            {wallet?.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h2>
                                    </div>
                                </div>

                                <div className="relative z-10 grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                                    <div className="space-y-1.5">
                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Vaulted Savings</p>
                                        <p className="text-xl font-black tracking-tighter">₹{(wallets?.savings?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Growth Rewards</p>
                                        <div className="flex items-center gap-3">
                                            <p className="text-xl font-black tracking-tighter">{rewardBalance} <span className="text-[10px] text-slate-500 ml-0.5">PTS</span></p>
                                            <button onClick={() => setActiveModal('convert')} className="text-[9px] font-black uppercase bg-white/10 px-3 py-1 rounded-lg hover:bg-white/20 transition-all">Swap</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-wider">Quick Actions</h3>
                                <div className="h-px flex-1 bg-slate-100"></div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {[
                                    { id: 'add', label: 'Add Money', icon: ArrowDownLeft, color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { id: 'send', label: 'Send Money', icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                    { id: 'voucher', label: 'Use Promo', icon: Gift, color: 'text-amber-600', bg: 'bg-amber-50' },
                                    { id: 'statement', label: 'Analytics', icon: History, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    { id: 'internal', label: 'Move Cash', icon: Wallet, color: 'text-violet-600', bg: 'bg-violet-50' }
                                ].map((action) => (
                                    <button
                                        key={action.id}
                                        onClick={() => setActiveModal(action.id)}
                                        className="flex flex-col items-center bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl ${action.bg} ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            <action.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-black text-[#0F172A] uppercase tracking-wide text-center">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-full lg:w-[38%]">
                        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm flex flex-col h-[650px]">
                            <h3 className="text-xl font-black text-[#0F172A] mb-8 uppercase tracking-widest flex items-center gap-3">
                                <History className="w-5 h-5 text-indigo-600" />
                                Activities
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <TransactionHistory transactions={mappedTransactions} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-16 border-t border-slate-100">
                    <AnalyticsDashboard transactions={mappedTransactions} />
                </div>
            </div>

            {/* Modals */}
            {activeModal === 'statement' && (
                <WalletStatementModal isOpen={true} onClose={closeModal} transactions={mappedTransactions} />
            )}

            {activeModal && activeModal !== 'statement' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 relative overflow-hidden">
                        <button onClick={closeModal} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-black text-[#0F172A] mb-2 uppercase tracking-tight">
                                {activeModal === 'add' && 'Add Money'}
                                {activeModal === 'send' && 'Send Money'}
                                {activeModal === 'voucher' && 'Use Promo'}
                                {activeModal === 'convert' && 'Swap Points'}
                                {activeModal === 'internal' && 'Move Cash'}
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Please confirm details below</p>
                        </div>

                        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-red-100">{error}</div>}
                        {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-emerald-100">{success}</div>}

                        <div className="space-y-6">
                            {(activeModal === 'add' || activeModal === 'send') && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Money Amount</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none font-black text-2xl transition-all"
                                    />
                                </div>
                            )}

                            {activeModal === 'send' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Recipient Email</label>
                                    <input
                                        type="email"
                                        value={receiverEmail}
                                        onChange={e => setReceiverEmail(e.target.value)}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-100 outline-none font-bold"
                                    />
                                </div>
                            )}

                            {activeModal === 'voucher' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Promo Code</label>
                                    <input
                                        type="text"
                                        value={voucherCode}
                                        onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-100 outline-none font-black text-xl tracking-widest text-center uppercase"
                                    />
                                </div>
                            )}

                            {activeModal === 'convert' && (
                                <div className="space-y-2 text-center bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Convert Points to INR</p>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            className="w-full bg-transparent text-center font-black text-4xl text-amber-900 outline-none"
                                        />
                                        <button onClick={() => setAmount(rewardBalance)} className="mt-4 text-[9px] font-black uppercase bg-amber-200/50 px-4 py-2 rounded-full hover:bg-amber-200 transition-colors">Max: {rewardBalance} Pts</button>
                                    </div>
                                </div>
                            )}

                            {activeModal === 'internal' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase">From</label>
                                            <select value={fromWallet} onChange={e => setFromWallet(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold">
                                                <option value="Main">Main</option>
                                                <option value="Savings">Savings</option>
                                                <option value="Reward">Reward</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase">To</label>
                                            <select value={toWallet} onChange={e => setToWallet(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold">
                                                <option value="Main">Main</option>
                                                <option value="Savings">Savings</option>
                                                <option value="Reward">Reward</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Amount</label>
                                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-black text-xl" />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    if (activeModal === 'add') handleAction(() => addMoney(parseFloat(amount)));
                                    if (activeModal === 'send') handleAction(() => sendMoney(receiverEmail, parseFloat(amount)));
                                    if (activeModal === 'voucher') handleAction(() => applyVoucher(voucherCode));
                                    if (activeModal === 'convert') handleAction(() => convertPoints(parseFloat(amount)));
                                    if (activeModal === 'internal') handleAction(() => internalTransfer(fromWallet, toWallet, parseFloat(amount)));
                                }}
                                className="w-full py-5 bg-[#0F172A] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-colors shadow-lg active:scale-[0.98]"
                            >
                                Confirm Action
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
