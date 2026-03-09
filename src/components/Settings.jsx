import React from 'react';

const Settings = ({ onBackup, onRestore, toggleTheme, theme, isAdmin }) => {
    return (
        <div className="card">
            <div className="header-row">
                <h1>Settings</h1>
            </div>
            <div className="settings-grid" style={{ marginTop: '20px' }}>
                <div className="settings-item">
                    <h4>Appearance</h4>
                    <p>Toggle between Light and Dark mode</p>
                    <button className="btn" onClick={toggleTheme} style={{ background: theme === 'dark' ? '#fbbf24' : '#1f2937', color: theme === 'dark' ? '#000' : '#fff' }}>
                        {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                </div>

                {isAdmin && (
                    <div className="settings-item">
                        <h4>Data Management</h4>
                        <p>Backup or restore your data</p>
                        <button className="btn btn-backup" onClick={onBackup}>
                            📥 Backup Data (JSON)
                        </button>
                        <div style={{ marginTop: '10px', position: 'relative' }}>
                            <button className="btn btn-restore" onClick={() => document.getElementById('restoreFile').click()}>
                                📤 Restore Data
                            </button>
                            <input
                                type="file"
                                id="restoreFile"
                                accept=".json"
                                style={{ display: 'none' }}
                                onChange={onRestore}
                            />
                        </div>
                    </div>
                )}

                <div className="settings-item">
                    <h4>About</h4>
                    <p>Chhath Puja Management App</p>
                    <p>Version 3.1 React</p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
