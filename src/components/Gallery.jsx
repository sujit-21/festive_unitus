import React, { useState } from 'react';

const Gallery = ({ gallery, onSave, isAdmin }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({ url: '', caption: '' });

    const handleAdd = () => {
        setIsAdding(true);
        setEditItem(null);
        setFormData({ url: '', caption: '' });
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setIsAdding(true);
        setFormData({ url: item.url, caption: item.caption });
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this image?')) {
            onSave(gallery.filter(item => item.id !== id));
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
                setFormData({ ...formData, url: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.url) {
            alert("Please provide an image URL or upload a file.");
            return;
        }
        if (editItem) {
            onSave(gallery.map(item => item.id === editItem.id ? { ...item, ...formData } : item));
        } else {
            onSave([...gallery, { id: Date.now().toString(), ...formData }]);
        }
        setIsAdding(false);
        setEditItem(null);
    };

    return (
        <div className="card">
            <div className="header-row">
                <h1>🖼️ Gallery</h1>
                {isAdmin && !isAdding && (
                    <button className="btn btn-add" onClick={handleAdd}>+ Add Image</button>
                )}
            </div>

            {isAdding && isAdmin && (
                <div className="card" style={{ background: 'var(--bg)', marginBottom: '20px' }}>
                    <h3>{editItem ? 'Edit Image' : 'Add New Image'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div style={{ flexBasis: '100%' }}>
                                <label>Image Source</label>
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
                                        value={formData.url.startsWith('data:') ? '' : formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        style={{ flex: 2 }}
                                    />
                                </div>
                                {formData.url && (
                                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Preview:</p>
                                        <img src={formData.url} alt="Preview" style={{ maxHeight: '100px', borderRadius: '4px' }} />
                                    </div>
                                )}
                            </div>
                            <div style={{ flexBasis: '100%' }}>
                                <label>Caption</label>
                                <input
                                    type="text"
                                    placeholder="Enter image caption"
                                    value={formData.caption}
                                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '20px',
                marginTop: '20px'
            }}>
                {gallery.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                        No images in gallery yet.
                    </div>
                ) : (
                    gallery.map(item => (
                        <div key={item.id} className="card" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
                            <img
                                src={item.url}
                                alt={item.caption}
                                style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Image+Load+Error'; }}
                            />
                            {item.caption && (
                                <div style={{ padding: '10px', fontSize: '14px', textAlign: 'center' }}>
                                    {item.caption}
                                </div>
                            )}
                            {isAdmin && (
                                <div style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    display: 'flex', gap: '5px'
                                }}>
                                    <button className="btn" style={{ padding: '5px', background: 'rgba(255,255,255,0.8)', color: '#000' }} onClick={() => handleEdit(item)}>✏️</button>
                                    <button className="btn" style={{ padding: '5px', background: 'rgba(239, 68, 68, 0.8)', color: '#fff' }} onClick={() => handleDelete(item.id)}>🗑️</button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Gallery;
