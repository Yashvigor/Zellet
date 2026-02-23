import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import { Wallet, LogOut, Plus, Send, Gift, History, X, ArrowUpRight, ArrowDownLeft, ShieldCheck, ChevronRight } from 'lucide-react';
import TransactionHistory from '../components/TransactionHistory';
import WalletStatementModal from '../components/WalletStatementModal';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

export default function Dashboard() {
    const { currentUser, wallet, rewardBalance, logout, addMoney, sendMoney, applyVoucher, convertPoints, getUserTransactions } = useWallet();
    const navigate = useNavigate();

    const [activeModal, setActiveModal] = useState(null); // 'add', 'send', 'voucher', 'statement'
    const [amount, setAmount] = useState('');
    const [receiverEmail, setReceiverEmail] = useState('');
    const [voucherCode, setVoucherCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const transactions = getUserTransactions(currentUser?.id);

    // Remap transactions to indicate + or - based on current user
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

    const handleAction = (actionFn) => {
        setError('');
        setSuccess('');
        try {
            actionFn();
            setSuccess('Transaction successful!');
            setTimeout(() => closeModal(), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafbfc] font-sans text-brand-dark pb-20">

            {/* Top Navbar */}
            <nav className="bg-white border-b border-gray-100 px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-dark rounded-xl flex items-center justify-center shadow-md">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-heading font-bold tracking-tight text-brand-dark">Zellet.</span>
                </div>
                <div className="flex items-center gap-5">
                    <div className="hidden md:flex flex-col text-right">
                        <p className="text-sm font-heading font-semibold text-gray-900 flex items-center justify-end gap-2">
                            {currentUser?.name}
                            {currentUser?.tier && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${currentUser.tier === 'Platinum' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                                        currentUser.tier === 'Gold' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                            'bg-gray-100 text-gray-600 border border-gray-200'
                                    }`}>
                                    {currentUser.tier}
                                </span>
                            )}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">{currentUser?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-100"
                        title="Secure Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Column: Welcome & Actions */}
                    <div className="w-full lg:w-7/12 flex flex-col gap-8">

                        {/* Greeting */}
                        <div>
                            <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2 tracking-tight">
                                Good afternoon, {currentUser?.name.split(' ')[0]}
                            </h1>
                            <p className="text-gray-500 font-medium">Here's your financial overview for today.</p>
                        </div>

                        {/* Premium Balance Card */}
                        <div className="relative overflow-hidden rounded-[2.5rem] p-10 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 bg-gradient-to-br from-indigo-900 via-[#0a0f1c] to-purple-900 group">
                            {/* Decorative background meshes */}
                            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-400/30 transition-colors duration-700"></div>
                            <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-500/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 group-hover:bg-pink-500/20 transition-colors duration-700"></div>

                            <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-300 text-sm font-medium mb-2 tracking-widest uppercase font-heading">Available Balance</p>
                                        <h2 className="text-5xl md:text-6xl font-heading font-extrabold tracking-tight drop-shadow-sm">
                                            ₹{wallet?.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h2>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-2 shadow-inner">
                                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                        <span className="text-sm font-semibold tracking-wide text-emerald-50">Verified</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-1">Reward Points</p>
                                        <div className="flex items-center gap-3">
                                            <p className="font-mono text-xl font-bold tracking-wider text-amber-400">
                                                {rewardBalance} PTS
                                            </p>
                                            <button onClick={() => setActiveModal('convert')} className="text-xs bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 transition-colors px-3 py-1 rounded-full font-semibold border border-amber-500/30">
                                                Convert to INR
                                            </button>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-sm">
                                        <Wallet className="w-5 h-5 text-gray-300" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Grid */}
                        <div>
                            <h3 className="text-lg font-heading font-bold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                                <button onClick={() => setActiveModal('add')} className="group relative overflow-hidden bg-white p-5 lg:p-6 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(37,99,235,0.15)] hover:border-blue-200 transition-all duration-300 text-left flex flex-col justify-between h-auto min-h-[160px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 relative z-10 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                                        <ArrowDownLeft className="w-5 h-5 lg:w-6 lg:h-6" />
                                    </div>
                                    <div className="relative z-10 mt-4 lg:mt-5">
                                        <span className="font-heading font-bold text-gray-900 block text-base lg:text-lg group-hover:text-blue-700 transition-colors leading-tight">Add Money</span>
                                        <span className="text-xs lg:text-sm text-gray-500 font-medium mt-1.5 block leading-snug">Top up balance</span>
                                    </div>
                                </button>

                                <button onClick={() => setActiveModal('send')} className="group relative overflow-hidden bg-white p-5 lg:p-6 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.15)] hover:border-indigo-200 transition-all duration-300 text-left flex flex-col justify-between h-auto min-h-[160px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 relative z-10 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                                        <ArrowUpRight className="w-5 h-5 lg:w-6 lg:h-6" />
                                    </div>
                                    <div className="relative z-10 mt-4 lg:mt-5">
                                        <span className="font-heading font-bold text-gray-900 block text-base lg:text-lg group-hover:text-indigo-700 transition-colors leading-tight">Send Money</span>
                                        <span className="text-xs lg:text-sm text-gray-500 font-medium mt-1.5 block leading-snug">To accounts</span>
                                    </div>
                                </button>

                                <button onClick={() => setActiveModal('voucher')} className="group relative overflow-hidden bg-white p-5 lg:p-6 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(219,39,119,0.15)] hover:border-pink-200 transition-all duration-300 text-left flex flex-col justify-between h-auto min-h-[160px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                                    <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100 relative z-10 group-hover:bg-pink-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                                        <Gift className="w-5 h-5 lg:w-6 lg:h-6 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="relative z-10 mt-4 lg:mt-5">
                                        <span className="font-heading font-bold text-gray-900 block text-base lg:text-lg group-hover:text-pink-700 transition-colors leading-tight">Vouchers</span>
                                        <span className="text-xs lg:text-sm text-gray-500 font-medium mt-1.5 block leading-snug">Redeem codes</span>
                                    </div>
                                </button>

                                <button onClick={() => setActiveModal('statement')} className="group relative overflow-hidden bg-white p-5 lg:p-6 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(13,148,136,0.15)] hover:border-teal-200 transition-all duration-300 text-left flex flex-col justify-between h-auto min-h-[160px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 relative z-10 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300 shadow-sm shrink-0">
                                        <History className="w-5 h-5 lg:w-6 lg:h-6 group-hover:-rotate-12 transition-transform" />
                                    </div>
                                    <div className="relative z-10 mt-4 lg:mt-5">
                                        <span className="font-heading font-bold text-gray-900 block text-base lg:text-lg group-hover:text-teal-700 transition-colors leading-tight">Statements</span>
                                        <span className="text-xs lg:text-sm text-gray-500 font-medium mt-1.5 block leading-snug">View reports</span>
                                    </div>
                                </button>

                            </div>
                        </div>

                    </div>

                    {/* Right Column: Transaction History */}
                    <div className="w-full lg:w-5/12">
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-card h-full">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                                        <History className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <h3 className="text-xl font-heading font-bold text-gray-900">Recent Activity</h3>
                                </div>
                                <button className="text-sm font-semibold text-brand-primary flex items-center hover:text-blue-800 transition-colors">
                                    View All <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                <TransactionHistory transactions={mappedTransactions} />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Bottom Row: Analytics */}
                <div className="w-full mt-4">
                    <AnalyticsDashboard transactions={mappedTransactions} />
                </div>
            </div>

            {/* MODALS Component (Re-using standard design) */}
            {activeModal === 'statement' && (
                <WalletStatementModal
                    isOpen={true}
                    onClose={closeModal}
                    transactions={mappedTransactions}
                />
            )}

            {activeModal && activeModal !== 'statement' && (
                <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
                        <button onClick={closeModal} className="absolute top-6 right-6 w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 transition-colors">
                            <X className="w-4 h-4" />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-3xl font-heading font-extrabold text-gray-900 mb-2">
                                {activeModal === 'add' && 'Add Funds'}
                                {activeModal === 'send' && 'Transfer Funds'}
                                {activeModal === 'voucher' && 'Redeem Voucher'}
                                {activeModal === 'convert' && 'Convert Points'}
                            </h2>
                            <p className="text-gray-500 font-medium text-sm">
                                {activeModal === 'add' && 'Top up your digital wallet instantly.'}
                                {activeModal === 'send' && 'Send money securely to any verified email.'}
                                {activeModal === 'voucher' && 'Enter your promo code to claim rewards.'}
                                {activeModal === 'convert' && 'Exchange your reward points for INR balance.'}
                            </p>
                        </div>

                        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-medium border border-red-100 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>{error}</div>}
                        {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-medium border border-emerald-100 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{success}</div>}

                        <div className="space-y-5">
                            {(activeModal === 'add' || activeModal === 'send') && (
                                <div>
                                    <label className="block text-sm font-heading font-bold text-gray-700 mb-2">Amount (INR)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            className="w-full pl-8 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none font-semibold text-lg transition-all"
                                            placeholder="0.00"
                                            min="1"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeModal === 'send' && (
                                <div>
                                    <label className="block text-sm font-heading font-bold text-gray-700 mb-2">Recipient Email</label>
                                    <input
                                        type="email"
                                        value={receiverEmail}
                                        onChange={e => setReceiverEmail(e.target.value)}
                                        className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none font-medium transition-all"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            )}

                            {activeModal === 'voucher' && (
                                <div>
                                    <label className="block text-sm font-heading font-bold text-gray-700 mb-2">Voucher Code</label>
                                    <input
                                        type="text"
                                        value={voucherCode}
                                        onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                                        className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none font-mono font-bold tracking-widest uppercase text-center text-lg transition-all"
                                        placeholder="PROMO-2026"
                                    />
                                </div>
                            )}

                            {activeModal === 'convert' && (
                                <div>
                                    <label className="block text-sm font-heading font-bold text-gray-700 mb-2">Points to Convert</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-xl">★</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            className="w-full pl-10 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none font-semibold text-lg transition-all"
                                            placeholder="100"
                                            min="1"
                                            max={rewardBalance}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-2 px-1">
                                        <p className="text-xs text-brand-dark font-medium">Rate: 1 PTS = 1 INR</p>
                                        <button onClick={() => setAmount(rewardBalance)} className="text-xs text-amber-600 font-bold hover:underline">Max: {rewardBalance} PTS</button>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    if (activeModal === 'add') handleAction(() => addMoney(parseFloat(amount)));
                                    if (activeModal === 'send') handleAction(() => sendMoney(receiverEmail, parseFloat(amount)));
                                    if (activeModal === 'voucher') handleAction(() => applyVoucher(voucherCode));
                                    if (activeModal === 'convert') handleAction(() => convertPoints(parseFloat(amount)));
                                }}
                                className={`w-full py-4 text-white font-heading font-bold rounded-2xl mt-4 transition-colors flex items-center justify-center gap-2 shadow-lg ${activeModal === 'convert' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-dark hover:bg-gray-800'
                                    }`}
                            >
                                {activeModal === 'add' && 'Confirm Deposit'}
                                {activeModal === 'send' && 'Send Payment'}
                                {activeModal === 'voucher' && 'Redeem Code'}
                                {activeModal === 'convert' && 'Convert to Wallet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
