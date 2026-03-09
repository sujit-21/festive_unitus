import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db'; // Import db directly for pre-check

function Login({ toggleView }) {
    const { login } = useAuth();
    const [activeTab, setActiveTab] = useState('user'); // 'user' or 'admin'
    const [view, setView] = useState('login'); // 'login' or 'forgot'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [clubName, setClubName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (view === 'login') {
            if (!username.includes('@')) {
                setError("Please enter a valid email address.");
                return;
            }

            const authenticatedUser = db.authenticate(username, password);

            if (authenticatedUser) {
                if (activeTab === 'admin' && authenticatedUser.role !== 'admin') {
                    setError("Access Denied: You are not an Admin.");
                    return;
                }
                login(username, password);
            } else {
                setError('Invalid email or password');
            }
        } else {
            // Handle Forgot Password
            const userToReset = db.verifyForgotPassword(username, clubName, uid);
            if (userToReset) {
                db.resetPassword(userToReset.id, newPassword);
                setSuccess('Password reset successfully! You can now login.');
                setTimeout(() => setView('login'), 2000);
            } else {
                setError('Invalid Email, Club Name or UID');
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass">
                {/* Tabs (Only for login) */}
                {view === 'login' && (
                    <div className="auth-tabs">
                        <div
                            className={`auth-tab ${activeTab === 'user' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('user'); setError(''); setSuccess(''); }}
                        >User Login</div>
                        <div
                            className={`auth-tab ${activeTab === 'admin' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('admin'); setError(''); setSuccess(''); }}
                        >Admin Login</div>
                    </div>
                )}

                <div className="auth-header">
                    <h2>{view === 'login' ? (activeTab === 'admin' ? 'Admin Portal' : 'Welcome Back') : 'Forgot Password'}</h2>
                    <p>{view === 'login' ? `Enter your ${activeTab === 'admin' ? 'admin ' : ''}credentials` : 'Verify your account details'}</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. name@gmail.com"
                            required
                        />
                    </div>

                    {view === 'login' ? (
                        <div className="input-group" style={{ position: 'relative' }}>
                            <label>Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <span
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '10px', top: '38px', cursor: 'pointer',
                                    fontSize: '18px', userSelect: 'none'
                                }}
                                title={showPassword ? "Hide Password" : "Show Password"}
                            >
                                {showPassword ? '👁️' : '🔒'}
                            </span>
                        </div>
                    ) : (
                        <>
                            <div className="input-group">
                                <label>Club Name</label>
                                <input
                                    type="text"
                                    value={clubName}
                                    onChange={(e) => setClubName(e.target.value)}
                                    placeholder="Enter your Club Name"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>UID (For members only)</label>
                                <input
                                    type="text"
                                    value={uid}
                                    onChange={(e) => setUid(e.target.value)}
                                    placeholder="Leave blank if Admin"
                                />
                            </div>
                            <div className="input-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <button type="submit" className="btn-primary">
                        {view === 'login' ? 'Sign In' : 'Reset Password'}
                    </button>
                </form>

                <div className="auth-footer">
                    {view === 'login' ? (
                        <>
                            <p style={{ marginBottom: '10px' }}>
                                <button onClick={() => setView('forgot')} className="text-link">Forgot password?</button>
                            </p>
                            <p>Don't have an account? <button onClick={toggleView} className="text-link">Sign up</button></p>
                        </>
                    ) : (
                        <p><button onClick={() => setView('login')} className="text-link">Back to Login</button></p>
                    )}
                </div>
            </div>
        </div>
    );
}



export default Login;
