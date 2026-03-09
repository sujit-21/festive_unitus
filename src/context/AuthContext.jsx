import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../services/db';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for active session in localStorage (simple persistence)
        const storedUser = localStorage.getItem('festival_current_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (username, password) => {
        const authenticatedUser = db.authenticate(username, password);
        if (authenticatedUser) {
            setUser(authenticatedUser);
            localStorage.setItem('festival_current_user', JSON.stringify(authenticatedUser));
            return true;
        }
        return false;
    };

    const signup = (username, password, uid, role = 'user', clubName = null) => {
        try {
            // Default role is user. UID is compulsory for users. ClubName for admins.
            const newUser = db.createUser(username, password, role, uid, clubName);

            // Auto login after signup
            const { password: _, ...safeUser } = newUser;
            setUser(safeUser);
            localStorage.setItem('festival_current_user', JSON.stringify(safeUser));
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };


    const logout = () => {
        setUser(null);
        localStorage.removeItem('festival_current_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
