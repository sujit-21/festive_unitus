import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Signup({ toggleView }) {
    const { signup } = useAuth();
    const [activeTab, setActiveTab] = useState('user'); // 'user' or 'admin'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [clubName, setClubName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [uid, setUid] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!username.includes('@')) {
            setError("Please enter a valid email address.");
            return;
        }

        const role = activeTab; // 'user' or 'admin'
        const effectiveUid = role === 'admin' ? null : uid;

        if (role === 'user' && !effectiveUid) {
            setError("Donation UID is mandatory for Member Signup.");
            return;
        }


        if (!clubName) {
            setError("Club Name is mandatory.");
            return;
        }

        const result = signup(username, password, effectiveUid, role, clubName);


        if (result.success) {
            setSuccess('Account created successfully!');
        } else {
            setError(result.message);
        }
    };


    return (
        <div className="auth-container">
            <div className="auth-card glass">
                {/* Tabs */}
                <div className="auth-tabs">
                    <div
                        className={`auth-tab ${activeTab === 'user' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('user'); setError(''); setSuccess(''); }}
                    >User Signup</div>
                    <div
                        className={`auth-tab ${activeTab === 'admin' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('admin'); setError(''); setSuccess(''); }}
                    >Admin Signup</div>
                </div>

                <div className="auth-header">
                    <h2>{activeTab === 'admin' ? 'Create Admin Account' : 'Create Account'}</h2>
                    <p>Join the community today</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="name@gmail.com"
                            required
                        />
                    </div>

                    <div className="input-group" style={{ position: 'relative' }}>
                        <label>Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
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

                    <div className="input-group">
                        <label>Club Name (Mandatory)</label>
                        <input
                            type="text"
                            value={clubName}
                            onChange={(e) => setClubName(e.target.value)}
                            placeholder="Ex: Young Star Club"
                            required
                        />
                    </div>

                    {activeTab === 'user' && (
                        <div className="input-group">
                            <label>Donation UID (Mandatory)</label>
                            <input
                                type="text"
                                value={uid}
                                onChange={(e) => setUid(e.target.value)}
                                placeholder="12-character UID"
                                required={activeTab === 'user'}
                            />
                            <small className="hint">Enter your 12-character Donation UID to link your record.</small>
                        </div>
                    )}




                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <button type="submit" className="btn-primary">Sign Up</button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <button onClick={toggleView} className="text-link">Sign in</button></p>
                </div>
            </div>
        </div>
    );
}

export default Signup;
