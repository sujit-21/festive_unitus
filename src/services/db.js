import CryptoJS from 'crypto-js';

const USERS_KEY = 'festival_users';

export const db = {
    // --- User Management ---

    getUsers: () => {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : [];
    },

    saveUsers: (users) => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    },

    createUser: (username, password, role = 'user', uid = null, clubName = null) => {
        const users = db.getUsers();
        if (users.find(u => u.username === username)) {
            throw new Error('Email already registered');
        }

        // Simple hash for password
        const hashedPassword = CryptoJS.SHA256(password).toString();

        const newUser = {
            id: Date.now().toString(),
            username, // This is Email-Id
            password: hashedPassword,
            role,
            uid: uid || null,
            clubName: clubName || null
        };

        // If this is the VERY first user, make them admin automatically
        if (users.length === 0) {
            newUser.role = 'admin';
        }

        users.push(newUser);
        db.saveUsers(users);
        return newUser;
    },

    deleteUser: (userId) => {
        let users = db.getUsers();
        users = users.filter(u => u.id !== userId);
        db.saveUsers(users);
    },

    resetPassword: (userId, newPassword) => {
        const users = db.getUsers();
        const userIdx = users.findIndex(u => u.id === userId);
        if (userIdx !== -1) {
            users[userIdx].password = CryptoJS.SHA256(newPassword).toString();
            db.saveUsers(users);
            return true;
        }
        return false;
    },

    authenticate: (username, password) => {
        const users = db.getUsers();
        const hashedPassword = CryptoJS.SHA256(password).toString();

        const user = users.find(u => u.username === username && u.password === hashedPassword);
        if (user) {
            // Return user without password
            const { password, ...safeUser } = user;
            return safeUser;
        }
        return null;
    },

    verifyForgotPassword: (email, clubName, uid = null) => {
        const users = db.getUsers();
        const user = users.find(u => u.username === email && u.clubName === clubName);
        if (!user) return null;

        // If it's a member/user, UID is also required to verify
        if (user.role === 'user' && user.uid !== uid) {
            return null;
        }

        return user;
    },


    updateUser: (userId, updates) => {
        const users = db.getUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1) {
            // Prevent duplicate usernames if they are changing it
            if (updates.username && users.find(u => u.username === updates.username && u.id !== userId)) {
                throw new Error("Email already in use by another account.");
            }
            users[idx] = { ...users[idx], ...updates };
            db.saveUsers(users);
            return true;
        }
        return false;
    },

    // Admin: Can see everything
    // User: Can only see their linked serial data

    checkAccess: (user, dataUid) => {
        if (user.role === 'admin') return true;
        if (user.role === 'user' && user.uid === dataUid) return true;
        return false;
    }
};

