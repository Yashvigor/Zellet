import React, { createContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
    // Initialize state from local storage or defaults
    const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('fw_users')) || []);
    const [wallets, setWallets] = useState(() => JSON.parse(localStorage.getItem('fw_wallets')) || []);
    const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem('fw_transactions')) || []);
    const [vouchers, setVouchers] = useState(() => JSON.parse(localStorage.getItem('fw_vouchers')) || []);
    const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('fw_currentUser')) || null);

    // Sync to local storage on change
    useEffect(() => { localStorage.setItem('fw_users', JSON.stringify(users)); }, [users]);
    useEffect(() => { localStorage.setItem('fw_wallets', JSON.stringify(wallets)); }, [wallets]);
    useEffect(() => { localStorage.setItem('fw_transactions', JSON.stringify(transactions)); }, [transactions]);
    useEffect(() => { localStorage.setItem('fw_vouchers', JSON.stringify(vouchers)); }, [vouchers]);
    useEffect(() => { localStorage.setItem('fw_currentUser', JSON.stringify(currentUser)); }, [currentUser]);

    const register = (name, email, phone, password) => {
        if (users.find(u => u.email === email)) {
            throw new Error("Email already registered");
        }
        const newUserId = uuidv4();
        const newWalletId = uuidv4();

        const newUser = { id: newUserId, name, email, phone, password, wallet_id: newWalletId, role: 'user' };
        const newWallet = { wallet_id: newWalletId, user_id: newUserId, balance: 0 };

        setUsers([...users, newUser]);
        setWallets([...wallets, newWallet]);
        setCurrentUser(newUser);
    };

    const login = (email, password) => {
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new Error("Invalid email or password");
        }
        setCurrentUser(user);
        return user;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const getWallet = (userId = currentUser?.id) => {
        return wallets.find(w => w.user_id === userId);
    };

    const addTransaction = (sender_id, receiver_id, amount, type) => {
        const newTx = {
            id: uuidv4(),
            sender_id,
            receiver_id,
            amount,
            type, // 'Credit', 'Debit', 'Voucher Credit'
            date: new Date().toISOString()
        };
        setTransactions(prev => [newTx, ...prev]);
    };

    const addMoney = (amount) => {
        if (!currentUser || amount <= 0) return;

        setWallets(prevWallets => prevWallets.map(w => {
            if (w.user_id === currentUser.id) {
                return { ...w, balance: w.balance + amount };
            }
            return w;
        }));
        addTransaction(null, currentUser.id, amount, 'Credit');
    };

    const sendMoney = (receiverEmail, amount) => {
        if (!currentUser || amount <= 0) throw new Error("Invalid amount");

        const receiver = users.find(u => u.email === receiverEmail);
        if (!receiver) throw new Error("Receiver not found");
        if (receiver.id === currentUser.id) throw new Error("Cannot send money to yourself");

        const myWallet = getWallet();
        if (myWallet.balance < amount) throw new Error("Insufficient balance");

        // Process transaction
        setWallets(prevWallets => prevWallets.map(w => {
            if (w.user_id === currentUser.id) return { ...w, balance: w.balance - amount };
            if (w.user_id === receiver.id) return { ...w, balance: w.balance + amount };
            return w;
        }));

        addTransaction(currentUser.id, receiver.id, amount, 'Transfer');
    };

    const applyVoucher = (code) => {
        if (!currentUser) return;

        const index = vouchers.findIndex(v => v.code === code);
        if (index === -1) throw new Error("Invalid voucher code");

        const voucher = vouchers[index];
        if (voucher.status !== 'Active') throw new Error(`Voucher is ${voucher.status}`);
        if (new Date(voucher.expiry) < new Date()) {
            // Auto-expire
            const updatedVouchers = [...vouchers];
            updatedVouchers[index] = { ...voucher, status: 'Expired' };
            setVouchers(updatedVouchers);
            throw new Error("Voucher is expired");
        }

        // Apply voucher
        setWallets(prevWallets => prevWallets.map(w => {
            if (w.user_id === currentUser.id) {
                return { ...w, balance: w.balance + voucher.amount };
            }
            return w;
        }));

        // Mark as used
        const updatedVouchers = [...vouchers];
        updatedVouchers[index] = { ...voucher, status: 'Used' };
        setVouchers(updatedVouchers);

        addTransaction('SYSTEM', currentUser.id, voucher.amount, 'Voucher Credit');
    };

    // Admin Methods
    const createVoucher = (code, amount, expiry) => {
        if (vouchers.find(v => v.code === code)) throw new Error("Voucher code already exists");
        const newVoucher = {
            id: uuidv4(),
            code,
            amount: parseFloat(amount),
            expiry,
            status: 'Active'
        };
        setVouchers([...vouchers, newVoucher]);
    };

    const getUserTransactions = (userId = currentUser?.id) => {
        return transactions.filter(t => t.sender_id === userId || t.receiver_id === userId);
    };

    const value = {
        currentUser,
        users,
        vouchers,
        transactions,
        wallet: currentUser ? getWallet() : null,
        register,
        login,
        logout,
        addMoney,
        sendMoney,
        applyVoucher,
        createVoucher,
        getUserTransactions,
        getAllData: () => ({ users, wallets, transactions, vouchers })
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};
