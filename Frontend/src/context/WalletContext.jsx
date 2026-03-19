import React, { createContext, useState, useEffect, useCallback } from 'react';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [wallets, setWallets] = useState({ main: { balance: 0 }, savings: { balance: 0 }, reward: { balance: 0 } });
    const [wallet, setWallet] = useState(null); // Keep for backwards compatibility if needed, or point to main
    const [rewardBalance, setRewardBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [adminData, setAdminData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    const authFetch = async (url, options = {}) => {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        const storedToken = localStorage.getItem('zellet_token');
        if (storedToken) {
            headers['Authorization'] = `Bearer ${storedToken}`;
        }
        const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'API Request Failed');
        return data;
    };

    const fetchUserData = useCallback(async () => {
        if (!localStorage.getItem('zellet_token')) {
            setIsLoading(false);
            return;
        }
        try {
            const user = await authFetch('/api/auth/me');
            setCurrentUser(user);

            // Always fetch personal wallet data for all users
            const userWallets = await authFetch('/api/wallet/all');
            setWallets(userWallets);
            setWallet({ balance: userWallets.main?.balance || 0 });
            setRewardBalance(userWallets.reward?.balance || 0);

            const userTxs = await authFetch('/api/wallet/transactions');
            setTransactions(userTxs);
            const activeVouchers = await authFetch('/api/vouchers');
            setVouchers(activeVouchers);

            // Additionally fetch global data if admin
            if (user.role === 'admin') {
                const globalData = await authFetch('/api/admin/data');
                setAdminData(globalData);
            }
        } catch (err) {
            console.error("Session fetch failed:", err);
            logout(); // Clear invalid token
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const register = async (name, email, phone, password, role) => {
        const data = await authFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, phone, password, role })
        });
        localStorage.setItem('zellet_token', data.token);
        await fetchUserData();
        return data.user;
    };

    const login = async (email, password) => {
        const data = await authFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        localStorage.setItem('zellet_token', data.token);
        await fetchUserData();
        return data.user;
    };

    const loginWithGoogle = async (credential) => {
        const data = await authFetch('/api/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential })
        });
        localStorage.setItem('zellet_token', data.token);
        await fetchUserData();
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem('zellet_token');
        setCurrentUser(null);
        setWallet(null);
        setRewardBalance(0);
        setTransactions([]);
        setAdminData(null);
    };

    const addMoney = async (amount) => {
        const newWallet = await authFetch('/api/wallet/add', {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
        setWallet(newWallet);
        await fetchUserData(); // Refresh txs
    };

    const sendMoney = async (receiverEmail, amount) => {
        await authFetch('/api/wallet/transfer', {
            method: 'POST',
            body: JSON.stringify({ receiverEmail, amount })
        });
        await fetchUserData(); // Refresh wallet and txs
    };

    const internalTransfer = async (fromWalletType, toWalletType, amount) => {
        await authFetch('/api/wallet/internal-transfer', {
            method: 'POST',
            body: JSON.stringify({ fromWalletType, toWalletType, amount })
        });
        await fetchUserData(); // Refresh wallets
    };

    const applyVoucher = async (code) => {
        await authFetch('/api/vouchers/apply', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
        await fetchUserData(); // Refresh wallet and txs
    };

    const convertPoints = async (pointsToConvert) => {
        await authFetch('/api/rewards/convert', {
            method: 'POST',
            body: JSON.stringify({ pointsToConvert })
        });
        await fetchUserData(); // Refresh wallet, reward points, txs
    };

    const createVoucher = async (code, amount, expiry, min_balance, event_category, max_uses) => {
        await authFetch('/api/vouchers/create', {
            method: 'POST',
            body: JSON.stringify({ code, amount, expiry, min_balance, event_category, max_uses })
        });
        await fetchUserData(); // refresh admin data
    };

    const updateUserTier = async (userId, tier) => {
        await authFetch('/api/admin/user/tier', {
            method: 'POST',
            body: JSON.stringify({ userId, tier })
        });
        await fetchUserData();
    };

    const updateWalletStatus = async (walletId, status) => {
        await authFetch('/api/admin/wallet/status', {
            method: 'POST',
            body: JSON.stringify({ walletId, status })
        });
        await fetchUserData();
    };

    const adjustWalletBalance = async (walletId, amount, type) => {
        await authFetch('/api/admin/wallet/adjust', {
            method: 'POST',
            body: JSON.stringify({ walletId, amount, type })
        });
        await fetchUserData();
    };

    const getUserTransactions = () => transactions;

    const getAllData = () => adminData || { users: [], wallets: [], transactions: [], vouchers: [], logs: [] };

    const value = {
        currentUser,
        wallet,
        rewardBalance,
        vouchers,
        transactions,
        users: adminData?.users || [],
        isLoading,
        register,
        login,
        loginWithGoogle,
        logout,
        addMoney,
        sendMoney,
        internalTransfer,
        applyVoucher,
        convertPoints,
        createVoucher,
        updateUserTier,
        updateWalletStatus,
        adjustWalletBalance,
        getUserTransactions,
        getAllData
    };

    return (
        <WalletContext.Provider value={value}>
            {!isLoading && children}
        </WalletContext.Provider>
    );
};
