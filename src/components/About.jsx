import React, { useState } from 'react';

const About = ({ content, onSave, isAdmin }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempContent, setTempContent] = useState(content || '');

    const handleEdit = () => {
        setTempContent(content || '');
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = () => {
        onSave(tempContent);
        setIsEditing(false);
    };

    return (
        <div className="card">
            <div className="header-row">
                <h1>🪔 About CHHATH Puja</h1>
                {isAdmin && !isEditing && (
                    <button className="btn btn-update" onClick={handleEdit}>✏️ Edit Content</button>
                )}
            </div>

            <div className="tab-content-body" style={{ marginTop: '20px' }}>
                {isEditing && isAdmin ? (
                    <div>
                        <textarea
                            style={{
                                width: '100%',
                                minHeight: '300px',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                fontSize: '16px',
                                lineHeight: '1.6',
                                background: 'var(--bg)',
                                color: 'var(--text)',
                                resize: 'vertical'
                            }}
                            value={tempContent}
                            onChange={(e) => setTempContent(e.target.value)}
                            placeholder="Write about CHHATH Puja here..."
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                            <button className="btn btn-cancel" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        fontSize: '16px',
                        lineHeight: '1.8',
                        whiteSpace: 'pre-wrap',
                        color: 'var(--text)',
                        padding: '10px'
                    }}>
                        {content ? content : (
                            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '40px' }}>
                                No content available yet. {isAdmin && "Click 'Edit Content' to write about Chhath Puja."}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default About;
