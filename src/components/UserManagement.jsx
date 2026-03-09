import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';

function UserManagement({ showToast }) {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPass, setNewUserPass] = useState('');
    const [newUserUid, setNewUserUid] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const loadUsers = () => {
        const allUsers = db.getUsers();
        // Filter: Admin only sees users from their same club (case-insensitive)
        if (currentUser && currentUser.role === 'admin') {
            setUsers(allUsers.filter(u =>
                u.clubName?.trim().toLowerCase() === currentUser.clubName?.trim().toLowerCase()
            ));
        } else {
            setUsers([]);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [currentUser]);


    const handleDelete = (id, username) => {
        if (username === currentUser.username) {
            if (showToast) showToast("You cannot delete yourself!", "error");
            else alert("You cannot delete yourself!");
            return;
        }
        if (window.confirm(`Are you sure you want to delete user '${username}'?`)) {
            db.deleteUser(id);
            loadUsers();
            if (showToast) showToast(`User '${username}' deleted.`);
        }
    };

    const handleResetPassword = (id, username) => {
        const newPass = prompt(`Enter new password for ${username}:`);
        if (newPass) {
            db.resetPassword(id, newPass);
            if (showToast) showToast(`Password for ${username} updated.`);
            else alert(`Password for ${username} has been updated.`);
        }
    };

    const handleEditUser = (u) => {
        const newEmail = prompt(`Update Email for ${u.username}:`, u.username);
        if (newEmail === null) return;

        let newUid = u.uid;
        if (u.role === 'user') {
            newUid = prompt(`Update UID for ${u.username}:`, u.uid || '');
            if (newUid === null) return;
        }

        try {
            db.updateUser(u.id, { username: newEmail, uid: newUid });
            loadUsers();
            if (showToast) showToast(`User details updated for ${newEmail}`);
        } catch (err) {
            if (showToast) showToast(err.message, "error");
            else alert(err.message);
        }
    };

    const handleCreateUser = (e) => {
        e.preventDefault();
        try {
            db.createUser(newUserEmail, newUserPass, 'user', newUserUid, currentUser.clubName);
            setNewUserEmail('');
            setNewUserPass('');
            setNewUserUid('');
            setShowAddForm(false);
            loadUsers();
            if (showToast) showToast(`User ${newUserEmail} created!`);
        } catch (err) {
            if (showToast) showToast(err.message, "error");
            else alert(err.message);
        }
    };

    return (
        <div className="card">
            <div className="header-row">
                <h1>👥 User Management</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                        {showAddForm ? 'Cancel' : '+ New User'}
                    </button>
                    <button className="btn btn-update" onClick={loadUsers}>Refresh List</button>
                </div>
            </div>

            {showAddForm && (
                <form onSubmit={handleCreateUser} style={{
                    marginTop: '15px', padding: '15px', border: '1px solid var(--border)',
                    borderRadius: '8px', background: 'var(--bg-secondary)'
                }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Create Member Account for "{currentUser?.clubName}"</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={{ fontSize: '11px' }}>Email ID</label>
                            <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required placeholder="email@gmail.com" style={{ width: '100%', padding: '8px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px' }}>Password</label>
                            <input type="password" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '8px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px' }}>Donation UID</label>
                            <input type="text" value={newUserUid} onChange={e => setNewUserUid(e.target.value)} required placeholder="UID" style={{ width: '100%', padding: '8px' }} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-add" style={{ marginTop: '10px', width: '100%' }}>Register Member</button>
                </form>
            )}

            <div style={{ overflowX: 'auto', marginTop: '15px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '10px' }}>Email</th>
                            <th style={{ padding: '10px' }}>Club</th>
                            <th style={{ padding: '10px' }}>Role</th>
                            <th style={{ padding: '10px' }}>Linked UID</th>
                            <th style={{ padding: '10px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', opacity: 0.5 }}>
                                    No members found for this club yet. Use "+ New User" to add them.
                                </td>
                            </tr>
                        ) : users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '10px', fontWeight: '600' }}>
                                    {u.username}
                                    {u.username === currentUser?.username && <span style={{ marginLeft: '5px', fontSize: '10px', background: '#10b981', color: 'white', padding: '2px 4px', borderRadius: '4px' }}>YOU</span>}
                                </td>
                                <td style={{ padding: '10px' }}>{u.clubName || '-'}</td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                        background: u.role === 'admin' ? '#e0f2fe' : '#f3f4f6',
                                        color: u.role === 'admin' ? '#0369a1' : '#374151'
                                    }}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>

                                <td style={{ padding: '10px' }}>
                                    {u.uid ? <span style={{ fontFamily: 'monospace' }}>{u.uid}</span> : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Not Linked</span>}
                                </td>
                                <td style={{ padding: '10px' }}>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button
                                            className="btn"
                                            style={{ background: '#3b82f6', fontSize: '10px', padding: '4px 8px' }}
                                            onClick={() => handleEditUser(u)}
                                            title="Edit Credentials"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            className="btn"
                                            style={{ background: '#f59e0b', fontSize: '10px', padding: '4px 8px' }}
                                            onClick={() => handleResetPassword(u.id, u.username)}
                                            title="Reset Password"
                                        >
                                            🔑 Reset
                                        </button>
                                        <button
                                            className="btn"
                                            style={{ background: '#ef4444', fontSize: '10px', padding: '4px 8px' }}
                                            onClick={() => handleDelete(u.id, u.username)}
                                            disabled={u.username === currentUser?.username}
                                            title="Delete User"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: '20px', padding: '10px', background: 'var(--bg)', borderRadius: '8px', fontSize: '12px' }}>
                <p><strong>Total Users In System:</strong> {db.getUsers().length} account(s).</p>
                <p style={{ color: 'var(--muted)' }}>Only members belonging to <strong>"{currentUser?.clubName}"</strong> are visible here.</p>
                <p style={{ marginTop: '10px' }}><strong>Note:</strong> Passwords are stored securely (hashed) and cannot be viewed. Use "Reset" to set a new password for a user if they forget it.</p>
            </div>
        </div>
    );
}

export default UserManagement;
