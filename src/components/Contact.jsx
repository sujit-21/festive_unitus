import React, { useState } from 'react';

const Contact = ({ contacts, onSave, isAdmin }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', image: '', contact: '', address: '' });

    const handleAdd = () => {
        setIsAdding(true);
        setEditItem(null);
        setFormData({ name: '', image: '', contact: '', address: '' });
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setIsAdding(true);
        setFormData({ name: item.name, image: item.image, contact: item.contact, address: item.address });
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this admin card?')) {
            onSave(contacts.filter(item => item.id !== id));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Image size too large! Please choose an image smaller than 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editItem) {
            onSave(contacts.map(item => item.id === editItem.id ? { ...item, ...formData } : item));
        } else {
            onSave([...contacts, { id: Date.now().toString(), ...formData }]);
        }
        setIsAdding(false);
        setEditItem(null);
    };

    return (
        <div className="card">
            <div className="header-row">
                <h1>📞 Contact Admins</h1>
                {isAdmin && !isAdding && (
                    <button className="btn btn-add" onClick={handleAdd}>+ Add Admin</button>
                )}
            </div>

            {isAdding && isAdmin && (
                <div className="card" style={{ background: 'var(--bg)', marginBottom: '20px' }}>
                    <h3>{editItem ? 'Edit Admin Card' : 'Add New Admin Card'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div style={{ flexBasis: '100%' }}>
                                <label>Profile Image</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ flex: 1 }}
                                    />
                                    <span style={{ color: 'var(--muted)' }}>OR</span>
                                    <input
                                        type="url"
                                        placeholder="Paste Image URL"
                                        value={formData.image && formData.image.startsWith('data:') ? '' : formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        style={{ flex: 2 }}
                                    />
                                </div>
                                {formData.image && (
                                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Preview:</p>
                                        <img src={formData.image} alt="Preview" style={{ maxHeight: '80px', borderRadius: '50%' }} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label>Name</label>
                                <input
                                    type="text"
                                    placeholder="Admin Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label>Contact Number</label>
                                <input
                                    type="text"
                                    placeholder="+91 XXXXX XXXXX"
                                    value={formData.contact}
                                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ flexBasis: '100%' }}>
                                <label>Address</label>
                                <input
                                    type="text"
                                    placeholder="Admin Address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Add'}</button>
                                <button type="button" className="btn btn-cancel" onClick={() => setIsAdding(false)}>Cancel</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px',
                marginTop: '20px'
            }}>
                {contacts.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                        No admin contacts listed yet.
                    </div>
                ) : (
                    contacts.map(item => (
                        <div key={item.id} className="card contact-card" style={{ display: 'flex', gap: '15px', padding: '15px', position: 'relative' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f3f4f6' }}>
                                <img
                                    src={item.image || 'https://via.placeholder.com/80?text=Admin'}
                                    alt={item.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/80?text=Admin'; }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{item.name}</h3>
                                <p style={{ margin: '0 0 5px 0', color: 'var(--primary)', fontWeight: '600', fontSize: '14px' }}>📞 {item.contact}</p>
                                {item.address && <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>📍 {item.address}</p>}
                            </div>
                            {isAdmin && (
                                <div style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    display: 'flex', gap: '5px'
                                }}>
                                    <button className="btn" style={{ padding: '2px 5px', minHeight: 'auto', background: 'transparent', border: '1px solid var(--border)' }} onClick={() => handleEdit(item)}>✏️</button>
                                    <button className="btn" style={{ padding: '2px 5px', minHeight: 'auto', background: 'transparent', border: '1px solid var(--border)', color: '#ef4444' }} onClick={() => handleDelete(item.id)}>🗑️</button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Contact;
