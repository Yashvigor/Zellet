import React, { useState, useEffect } from 'react';
import { Wallet, Send, Gift, ShieldCheck, ChevronRight, Menu, X, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import logo from '../assets/logo.png';

export default function Landing() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { currentUser } = useWallet();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="relative overflow-hidden bg-brand-light font-sans text-brand-dark">
            {/* Dynamic Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-brand-light pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] animate-blob mix-blend-multiply opacity-70"></div>
                <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-100 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply opacity-70"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-emerald-100 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply opacity-70"></div>
            </div>

            {/* Navigation */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm py-2' : 'bg-transparent py-4'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shadow-brand-primary/20 group-hover:scale-105 transition-transform duration-300 p-1">
                                <img src={logo} alt="Zellet Logo" className="w-full h-full object-contain group-hover:animate-pulse" />
                            </div>
                            <span className="text-2xl font-bold font-heading tracking-tight text-brand-dark">
                                Zellet.
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-sm font-semibold text-gray-600 hover:text-brand-primary transition-colors">Features</a>
                            <a href="#security" className="text-sm font-semibold text-gray-600 hover:text-brand-primary transition-colors">Security</a>
                            <div className="flex items-center space-x-4 ml-4">
                                {currentUser ? (
                                    <Link to="/dashboard" className="px-6 py-2.5 text-sm font-bold text-white bg-brand-dark hover:bg-gray-800 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 transform">
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/auth" className="text-sm font-semibold text-gray-600 hover:text-brand-primary transition-colors">Log in</Link>
                                        <Link to="/auth" className="px-6 py-2.5 text-sm font-bold text-white bg-brand-primary hover:bg-blue-700 rounded-full transition-all shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_4px_25px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 transform">
                                            Sign up
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-gray-600 hover:text-brand-primary focus:outline-none"
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Nav */}
                <div className={`md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-xl transition-all duration-300 origin-top overflow-hidden ${isMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`}>
                    <div className="flex flex-col space-y-4 p-6">
                        <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-base font-semibold text-gray-600 hover:text-brand-primary p-2 transition-colors">Features</a>
                        <a href="#security" onClick={() => setIsMenuOpen(false)} className="text-base font-semibold text-gray-600 hover:text-brand-primary p-2 transition-colors">Security</a>
                        <hr className="border-gray-100" />
                        {currentUser ? (
                            <Link to="/dashboard" className="w-full text-center py-3 px-4 text-base font-bold text-white bg-brand-dark rounded-xl">Dashboard</Link>
                        ) : (
                            <>
                                <Link to="/auth" className="w-full text-left py-2 px-2 text-base font-semibold text-gray-600">Log in</Link>
                                <Link to="/auth" className="w-full text-center py-3 px-4 text-base font-bold text-white bg-brand-primary rounded-xl shadow-md">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 lg:pb-32 px-4 mx-auto max-w-7xl flex flex-col items-center text-center z-10">

                <div className="opacity-0 animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-brand-primary text-sm font-bold mb-8 shadow-sm">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-brand-primary animate-pulse"></span>
                    Experience Cashless Living
                </div>

                <h1 className="opacity-0 animate-fade-in-up-delay-1 text-5xl sm:text-7xl font-extrabold font-heading tracking-tight mb-6 leading-[1.1] text-brand-dark max-w-4xl">
                    <span className="block mb-2">Secure. Simple.</span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-indigo-500 to-brand-accent pb-2">
                        Cashless Future.
                    </span>
                </h1>

                <p className="opacity-0 animate-fade-in-up-delay-2 mt-4 max-w-2xl text-lg sm:text-xl text-gray-600 mb-10 font-medium">
                    The ultimate digital wallet management system. Add money, transfer funds securely, and unlock exclusive digital vouchers seamlessly.
                </p>

                <div className="opacity-0 animate-fade-in-up-delay-3 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button onClick={() => navigate('/auth')} className="group relative px-8 py-4 bg-brand-dark text-white rounded-full font-bold text-lg overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(15,23,42,0.3)] hover:-translate-y-1">
                        <span className="relative flex items-center justify-center gap-2">
                            Create Wallet
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </div>

                {/* Hero Mockup (Animated Float) */}
                <div className="opacity-0 animate-fade-in-up-delay-3 mt-20 w-full max-w-4xl relative perspective-1000">
                    {/* Main Mockup Card */}
                    <div className="animate-float bg-white rounded-3xl sm:rounded-[2.5rem] p-2 sm:p-4 shadow-2xl border border-gray-100 transform rotateX-[8deg] transition-all duration-700 hover:rotateX-0 relative z-20">
                        <div className="bg-[#fafbfc] rounded-2xl sm:rounded-[2rem] overflow-hidden border border-gray-100 flex flex-col">

                            {/* Fake Window Header */}
                            <div className="h-12 border-b border-gray-200 flex items-center px-4 gap-2 bg-white sticky top-0 z-10">
                                <div className="w-3.5 h-3.5 rounded-full bg-rose-400"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-amber-400"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-emerald-400"></div>
                                <div className="mx-auto block text-xs font-medium text-gray-400 font-mono tracking-wider absolute left-1/2 -translate-x-1/2">
                                    app.zellet.com
                                </div>
                            </div>

                            {/* Mockup Body */}
                            <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 relative bg-white">

                                {/* Card 1: Balance */}
                                <div className="relative overflow-hidden bg-brand-dark p-8 rounded-3xl border border-gray-800 shadow-xl group">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-brand-primary/30 transition-colors duration-500"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-accent/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

                                    <div className="relative z-10">
                                        <h3 className="text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wider">Total Balance</h3>
                                        <div className="text-4xl font-heading font-extrabold text-white mb-8">₹1,250.00</div>
                                        <button className="w-full py-4 bg-brand-primary/10 backdrop-blur-md text-blue-400 rounded-xl font-bold border border-brand-primary/20 hover:bg-brand-primary hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                                            <Wallet className="w-4 h-4" /> Add Money
                                        </button>
                                    </div>
                                </div>

                                {/* Card 2: Transactions */}
                                <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                                    <h3 className="text-gray-500 text-sm font-bold mb-5 font-heading uppercase tracking-wider">Recent Transactions</h3>
                                    <div className="space-y-4">
                                        {[
                                            { name: 'Alex Johnson', type: 'Sent', amount: '-₹50.00', icon: Send, color: 'text-gray-600', code: 'Transfer', bg: 'bg-white', amountColor: 'text-gray-900' },
                                            { name: 'Summer Promo', type: 'Voucher', amount: '+₹20.00', icon: Gift, color: 'text-emerald-500', code: 'PROMO20', bg: 'bg-white', amountColor: 'text-emerald-500' },
                                        ].map((tx, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                                        <tx.icon className={`w-5 h-5 ${tx.color}`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-brand-dark font-bold font-heading text-sm">{tx.name}</p>
                                                        <p className="text-gray-400 text-xs font-medium mt-0.5">{tx.code}</p>
                                                    </div>
                                                </div>
                                                <div className={`font-extrabold font-heading text-lg ${tx.amountColor}`}>
                                                    {tx.amount}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative blurred background behind mockup */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-brand-primary/20 via-brand-accent/20 to-emerald-400/20 blur-[80px] rounded-full -z-10 animate-pulse"></div>
                </div>
            </div>

            {/* Features Section */}
            <div id="features" className="py-24 relative z-10 w-full bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 opacity-0 animate-[fade-in-up_1s_ease-out_forwards]" style={{ animationTimeline: 'view()', animationRange: 'cover 0% cover 20%' }}>
                        <h2 className="text-3xl md:text-5xl font-extrabold font-heading text-brand-dark mb-4 tracking-tight">Everything you need</h2>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">A seamless platform to register, manage balances, and handle virtual transactions securely.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                title: 'Secure Accounts',
                                description: 'Simple and safe authentication. Register in seconds and keep your data safe.',
                                icon: ShieldCheck,
                                color: 'text-blue-600',
                                bg: 'bg-blue-50',
                                border: 'border-blue-100'
                            },
                            {
                                title: 'Instant Transfers',
                                description: 'Send money instantly to other users within the platform.',
                                icon: Send,
                                color: 'text-indigo-600',
                                bg: 'bg-indigo-50',
                                border: 'border-indigo-100'
                            },
                            {
                                title: 'Manage Balance',
                                description: 'Add money to your wallet at any time and track your full transaction history.',
                                icon: Wallet,
                                color: 'text-emerald-600',
                                bg: 'bg-emerald-50',
                                border: 'border-emerald-100'
                            },
                            {
                                title: 'Digital Vouchers',
                                description: 'Apply redeemable codes for instant platform credits and bonuses.',
                                icon: Gift,
                                color: 'text-pink-600',
                                bg: 'bg-pink-50',
                                border: 'border-pink-100'
                            }
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="bg-white p-8 rounded-[2rem] border border-gray-100 hover:border-brand-primary/30 shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center ${feature.bg} border ${feature.border} group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                                </div>
                                <h3 className="text-xl font-bold font-heading text-brand-dark mb-3 tracking-tight">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-sm font-medium">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-24 relative overflow-hidden bg-brand-dark">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full bg-brand-primary/40 blur-[120px] rounded-full point-events-none"></div>

                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-extrabold font-heading text-white mb-6">Ready to go cashless?</h2>
                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-medium">Join us today and experience the smartest way to manage your digital transactions without the hassle.</p>
                    <button onClick={() => navigate('/auth')} className="px-10 py-5 bg-white text-brand-dark rounded-full font-bold text-lg hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 hover:-translate-y-1 inline-flex items-center gap-2 group">
                        Get Started Now
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1">
                                <img src={logo} alt="Zellet Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-bold font-heading text-brand-dark">Zellet.</span>
                        </div>

                        <div className="flex gap-8 text-sm font-semibold text-gray-500">
                            <a href="#" className="hover:text-brand-primary transition-colors">Privacy</a>
                            <a href="#" className="hover:text-brand-primary transition-colors">Terms</a>
                            <a href="#" className="hover:text-brand-primary transition-colors">Support</a>
                        </div>

                        <div className="text-sm font-medium text-gray-400">
                            &copy; {new Date().getFullYear()} Zellet Inc.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
