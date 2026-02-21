import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';

import Landing from '../pages/Landing';
import Auth from '../pages/Auth';
import Dashboard from '../pages/Dashboard';
import Admin from '../pages/Admin';

// Protected Route Component
const ProtectedRoute = ({ children, requireRole }) => {
    const { currentUser } = useWallet();

    if (!currentUser) {
        return <Navigate to="/auth" />;
    }

    if (requireRole && currentUser.role !== requireRole) {
        return <Navigate to="/dashboard" />;
    }

    return children;
};

export default function AppRouter() {
    return (
        <BrowserRouter>
            <div className="min-h-screen text-brand-dark bg-brand-light flex flex-col">
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />

                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/admin" element={
                        <ProtectedRoute requireRole="admin">
                            <Admin />
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}
