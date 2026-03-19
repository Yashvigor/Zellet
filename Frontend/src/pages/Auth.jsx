import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ShieldCheck, ArrowRight, ArrowLeft, Plus } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { GoogleLogin } from '@react-oauth/google';
import logo from '../assets/logo.png';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const { login, register, loginWithGoogle } = useWallet();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            let user;
            if (isLogin) {
                user = await login(email, password);
            } else {
                if (!name.trim()) throw new Error('First name is required');
                if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) throw new Error('Please enter a valid email address');
                if (password.length < 6) throw new Error('Password must be at least 6 characters long');
                user = await register(name, email, phone, password, role);
            }

            if (user?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Error occurred while contacting server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        setError('');
        try {
            const user = await loginWithGoogle(credentialResponse.credential);
            if (user?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || "Failed to authenticate with Google.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">

            {/* Header / Brand */}
            <div className="mb-8 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="w-14 h-14 bg-white rounded-[1.25rem] p-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-center">
                    <img src={logo} alt="Zellet Logo" className="w-10 h-10 object-contain" />
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-black text-[#0F172A] tracking-tightest leading-none outline-none" style={{ fontFamily: 'Outfit' }}>Zellet</h1>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mt-1">Digital Financial System</p>
                </div>
            </div>

            {/* Auth Card - Matches Dashboard Aesthetic Scaling */}
            <div className="w-full max-w-[420px] bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.04)] border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-500">

                <div className="mb-8 text-center sm:text-left">
                    <h2 className="text-xl font-black text-[#0F172A] tracking-tightest mb-1" style={{ fontFamily: 'Outfit' }}>
                        {isLogin ? 'Login to your Account' : 'Create Account'}
                        <span className="text-indigo-600"></span>
                    </h2>
                    <p className="text-slate-400 text-[13px] font-medium leading-relaxed">
                        Secure door to your wallet management system.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-xl border border-red-100 flex items-center gap-3 animate-in shake duration-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-top-4 duration-500">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-sm appearance-none cursor-pointer"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-sm"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-[#0F172A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-70 mt-4 group"
                    >
                        {isLogin ? 'Grant Access' : 'Create Wallet'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                {/* Social Section - Properly at the bottom */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.4em]">
                        <span className="px-4 bg-white text-slate-300">Third-party Sign-in</span>
                    </div>
                </div>

                <div className="flex justify-center flex-col items-center gap-4">
                    <div className="hover:scale-[1.02] transition-transform duration-300 transform-gpu">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Authentication Failed')}
                            useOneTap
                            shape="pill"
                            theme="outline"
                            size="large"
                            text="continue_with"
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-50 w-full text-center">
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-[#0F172A] font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 mx-auto hover:text-indigo-600 transition-colors"
                        >
                            {isLogin ? (
                                <><Plus className="w-2.5 h-2.5" /> Create an Account</>
                            ) : (
                                <><ArrowLeft className="w-2.5 h-2.5" /> Login</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <p className="mt-12 text-slate-300 text-[9px] font-black uppercase tracking-[0.8em]">Financial Security Protocol © 2026</p>
        </div>
    );
}
