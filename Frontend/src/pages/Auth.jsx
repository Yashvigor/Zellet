import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, ShieldCheck, ArrowRight, Mail, Lock, User, Phone } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { GoogleLogin } from '@react-oauth/google';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const { login, register, loginWithGoogle } = useWallet();
    const navigate = useNavigate();

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
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
                user = await register(name, email, phone, password);
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

    const handleGoogleError = () => {
        setError("Google Sign-In was cancelled or failed.");
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-brand-light relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] animate-blob z-0"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[100px] animate-blob animation-delay-2000 z-0"></div>

            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 z-10 relative">
                <div className="flex justify-center mb-8">
                    <Link to="/" className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center shadow-md">
                        <Wallet className="w-7 h-7 text-white" />
                    </Link>
                </div>

                <h2 className="text-2xl font-bold text-center text-brand-dark mb-2">
                    {isLogin ? 'Welcome back' : 'Create an account'}
                </h2>
                <p className="text-center text-gray-500 text-sm mb-8">
                    {isLogin ? 'Enter your details to access your wallet' : 'Start your cashless journey today'}
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        {error}
                    </div>
                )}

                <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with Google</span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-8 space-y-4 w-full bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium">Authenticating safely...</p>
                        </div>
                    ) : (
                        <div className="w-full flex justify-center py-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap
                                context="use_client"
                                shape="pill"
                                theme="outline"
                                size="large"
                            />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number (Optional)</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 mt-4 bg-brand-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md shadow-brand-primary/20 disabled:opacity-70"
                        >
                            {isLogin ? 'Sign In with Email' : 'Sign Up with Email'}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm mx-auto w-max mt-6">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Secured by Password Hashing & JWT</span>
                    </div>

                    <div className="mt-8 text-center pt-6 border-t border-gray-100">
                        <p className="text-gray-500 text-sm">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                                className="text-brand-primary font-semibold hover:underline"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
