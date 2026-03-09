import React, { useState } from 'react';
import { exportDevoteeCardPDF } from '../utils/export';
import { generateCode128B } from '../utils/barcode';

const BarcodeRenderer = ({ value }) => {
    const pattern = generateCode128B(value || '00000000');
    return (
        <div style={{ display: 'flex', background: '#fff', padding: '2px', borderRadius: '2px', height: '20px', width: '100%' }}>
            {pattern.split('').map((bit, idx) => (
                <div key={idx} style={{
                    flex: bit === '1' ? '1' : '1',
                    background: bit === '1' ? '#000' : 'transparent',
                    height: '100%'
                }} />
            ))}
        </div>
    );
};

const DevoteeCard = ({ data, festivalName, clubName }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDevotee, setSelectedDevotee] = useState(null);
    const [cardType, setCardType] = useState('DEVOTEE');
    const [gender, setGender] = useState('M');
    const [validFrom, setValidFrom] = useState(new Date().getFullYear().toString());
    const [validUpto, setValidUpto] = useState((new Date().getFullYear() + 1).toString());
    const [profileImage, setProfileImage] = useState(null);
    const [bgMode, setBgMode] = useState('THEME'); // 'THEME', 'SINGLE', 'GRADIENT'
    const [customColor, setCustomColor] = useState('#1e293b');
    const [customGradient, setCustomGradient] = useState({ start: '#4f46e5', end: '#06b6d4' });

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setProfileImage(null);
    };

    const filteredDevotees = searchTerm ? data.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.uid && d.uid.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 10) : [];

    const getCardBackground = () => {
        if (bgMode === 'SINGLE') return customColor;
        if (bgMode === 'GRADIENT') return `linear-gradient(135deg, ${customGradient.start}, ${customGradient.end})`;

        switch (cardType) {
            case 'ADMIN':
                return 'linear-gradient(180deg, #FF9933 0%, #FFFFFF 50%, #128807 100%)'; // Vertical Tricolour Theme
            case 'MEMBER':
                return 'linear-gradient(135deg, #064e3b, #065f46)'; // Deep Green
            case 'DEVOTEE':
            default:
                return 'linear-gradient(135deg, #0f172a, #1E293B)'; // Slate/Dark Blue
        }
    };

    return (
        <div className="devotee-card-tab" style={{ padding: '10px' }}>
            <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Create Devotee Card</h3>
                <p style={{ color: 'var(--muted)', fontSize: '12px' }}>Search for a donor and customize their ID card details.</p>

                <div className="row g-3 mt-2">
                    <div className="col-md-6">
                        <label className="form-label small fw-bold">Search Devotee</label>
                        <input
                            type="text"
                            placeholder="Search by name or UID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-control"
                            style={{
                                padding: '10px',
                                borderRadius: '8px',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text)',
                                border: '1px solid var(--border)'
                            }}
                        />
                    </div>
                    <div className="col-md-2 text-center">
                        <label className="form-label small fw-bold">Role</label>
                        <select className="form-select" value={cardType} onChange={(e) => setCardType(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                            <option value="DEVOTEE">Devotee</option>
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div className="col-md-2 text-center">
                        <label className="form-label small fw-bold">Gender</label>
                        <div className="mt-1" style={{
                            display: 'flex',
                            background: 'var(--bg-secondary, #f1f5f9)',
                            padding: '3px',
                            borderRadius: '10px',
                            border: '1px solid var(--border)',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <button
                                className="btn w-100"
                                style={{
                                    padding: '6px 0',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    borderRadius: '8px',
                                    border: 'none',
                                    transition: 'all 0.2s',
                                    background: gender === 'M' ? 'var(--accent, #FF8A2B)' : 'transparent',
                                    color: gender === 'M' ? '#000' : 'var(--muted)',
                                    boxShadow: gender === 'M' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
                                }}
                                onClick={() => setGender('M')}
                            >
                                MALE
                            </button>
                            <button
                                className="btn w-100"
                                style={{
                                    padding: '6px 0',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    borderRadius: '8px',
                                    border: 'none',
                                    transition: 'all 0.2s',
                                    background: gender === 'F' ? 'var(--accent, #FF8A2B)' : 'transparent',
                                    color: gender === 'F' ? '#000' : 'var(--muted)',
                                    boxShadow: gender === 'F' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
                                }}
                                onClick={() => setGender('F')}
                            >
                                FEMALE
                            </button>
                        </div>
                    </div>
                    <div className="col-md-1 text-center">
                        <label className="form-label small fw-bold">From</label>
                        <input type="text" className="form-control text-center" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border)', padding: '5px' }} />
                    </div>
                    <div className="col-md-1 text-center">
                        <label className="form-label small fw-bold">Upto</label>
                        <input type="text" className="form-control text-center" value={validUpto} onChange={(e) => setValidUpto(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border)', padding: '5px' }} />
                    </div>
                    <div className="col-md-2 text-center">
                        <label className="form-label small fw-bold">Photo</label>
                        <div className="d-flex flex-column align-items-center gap-1">
                            {!profileImage ? (
                                <label className="btn btn-sm btn-outline-primary w-100" style={{ fontSize: '10px', padding: '5px 0' }}>
                                    Add Pic
                                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                </label>
                            ) : (
                                <div className="d-flex gap-1 w-100">
                                    <label className="btn btn-sm btn-outline-info flex-grow-1" style={{ fontSize: '10px', padding: '5px 0' }}>
                                        Edit
                                        <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                    <button className="btn btn-sm btn-outline-danger" onClick={removeImage} style={{ fontSize: '10px' }}>✕</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="row g-3 mt-1 align-items-end">
                    <div className="col-md-3">
                        <label className="form-label small fw-bold">Background Style</label>
                        <select className="form-select form-select-sm" value={bgMode} onChange={(e) => setBgMode(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                            <option value="THEME">Auto Theme</option>
                            <option value="SINGLE">Single Color (RGB)</option>
                            <option value="GRADIENT">Gradient Mix</option>
                        </select>
                    </div>
                    {bgMode === 'SINGLE' && (
                        <div className="col-md-2">
                            <label className="form-label small fw-bold">Select Color</label>
                            <div className="d-flex gap-2 align-items-center">
                                <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} style={{ width: '40px', height: '30px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }} />
                                <span style={{ fontSize: '10px', opacity: 0.6, fontFamily: 'monospace' }}>{customColor.toUpperCase()}</span>
                            </div>
                        </div>
                    )}
                    {bgMode === 'GRADIENT' && (
                        <>
                            <div className="col-md-2">
                                <label className="form-label small fw-bold">Start Color</label>
                                <input type="color" value={customGradient.start} onChange={(e) => setCustomGradient({ ...customGradient, start: e.target.value })} style={{ width: '40px', height: '30px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }} />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label small fw-bold">End Color</label>
                                <input type="color" value={customGradient.end} onChange={(e) => setCustomGradient({ ...customGradient, end: e.target.value })} style={{ width: '40px', height: '30px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }} />
                            </div>
                        </>
                    )}
                </div>

                {searchTerm && filteredDevotees.length > 0 && (
                    <div style={{ marginTop: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {filteredDevotees.map(d => (
                            <button
                                key={d.uid || d.serial}
                                className="btn"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text)',
                                    border: '1px solid var(--border)',
                                    padding: '8px 15px'
                                }}
                                onClick={() => setSelectedDevotee(d)}
                            >
                                {d.name}
                            </button>
                        ))}
                    </div>
                )}

                {searchTerm && filteredDevotees.length === 0 && (
                    <p style={{ marginTop: '15px', color: 'var(--muted)', fontStyle: 'italic' }}>No devotee found matching your search.</p>
                )}
            </div>

            {selectedDevotee ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div className="card devotee-card-preview border-0" style={{
                        width: '100%',
                        maxWidth: '500px',
                        padding: '0',
                        overflow: 'hidden',
                        background: getCardBackground(),
                        color: '#fff',
                        borderRadius: '15px',
                        position: 'relative',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                        aspectRatio: '1.586/1', // Standard banking card ratio
                        display: 'flex',
                        flexDirection: 'row',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        {/* Decorative background element */}
                        <div style={{
                            position: 'absolute',
                            top: '-20%',
                            left: '-10%',
                            width: '200px',
                            height: '200px',
                            background: 'var(--accent)',
                            filter: 'blur(80px)',
                            opacity: 0.1,
                            zIndex: 0
                        }}></div>

                        {/* Left Branding Strip */}
                        <div className="d-flex flex-column align-items-center justify-content-center" style={{
                            width: '30%',
                            height: '100%',
                            background: cardType === 'ADMIN' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                            borderRight: cardType === 'ADMIN' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.05)',
                            position: 'relative',
                            zIndex: 1,
                            padding: '15px'
                        }}>
                            {profileImage ? (
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    border: '2px solid var(--accent)',
                                    overflow: 'hidden',
                                    marginBottom: '10px',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ) : (
                                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🪔</div>
                            )}
                            <div className="text-center" style={{
                                letterSpacing: '2px',
                                opacity: cardType === 'ADMIN' ? 0.8 : 0.5,
                                fontSize: '8px',
                                fontWeight: '800',
                                color: cardType === 'ADMIN' ? '#000' : '#fff'
                            }}>
                                OFFICIAL<br />MEMBER
                            </div>
                        </div>

                        {/* Right Content Area */}
                        <div className="d-flex flex-column justify-content-between" style={{
                            width: '70%',
                            height: '100%',
                            padding: '25px',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            <div>
                                <h2 style={{
                                    margin: '0',
                                    fontSize: '10px',
                                    letterSpacing: '2px',
                                    color: cardType === 'ADMIN' ? '#000' : '#FF8A2B',
                                    fontWeight: '800'
                                }}>
                                    {festivalName.toUpperCase()}
                                </h2>
                                {clubName && (
                                    <h3 style={{
                                        margin: '2px 0 0',
                                        fontSize: '8px',
                                        letterSpacing: '1px',
                                        color: cardType === 'ADMIN' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)',
                                        fontWeight: '600'
                                    }}>
                                        {clubName.toUpperCase()}
                                    </h3>
                                )}

                                <h1 style={{
                                    margin: '15px 0 5px',
                                    fontSize: '24px',
                                    color: cardType === 'ADMIN' ? '#000' : '#fff',
                                    fontWeight: '800',
                                    lineHeight: '1.1',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {selectedDevotee.name.toUpperCase()}
                                </h1>

                                <div className="d-inline-block" style={{
                                    padding: '3px 12px',
                                    background: 'var(--accent)',
                                    color: '#000',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '900',
                                    marginBottom: '12px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    {cardType} • {gender === 'M' ? 'MALE' : 'FEMALE'}
                                </div>

                                <p style={{
                                    margin: '0',
                                    fontSize: '11px',
                                    opacity: cardType === 'ADMIN' ? 0.8 : 0.6,
                                    color: cardType === 'ADMIN' ? '#000' : '#fff',
                                    maxWidth: '90%'
                                }}>
                                    {selectedDevotee.address || 'Address not listed'}
                                </p>

                                <div style={{ width: '100px', marginTop: '10px' }}>
                                    <BarcodeRenderer value={selectedDevotee.uid} />
                                    <div style={{
                                        fontSize: '6px',
                                        textAlign: 'center',
                                        opacity: cardType === 'ADMIN' ? 0.8 : 0.4,
                                        marginTop: '2px',
                                        letterSpacing: '1px',
                                        fontFamily: 'monospace',
                                        color: cardType === 'ADMIN' ? '#000' : '#fff'
                                    }}>
                                        {selectedDevotee.uid}
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-end" style={{ borderTop: cardType === 'ADMIN' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                                <div className="text-start">
                                    <div style={{ fontSize: '7px', opacity: cardType === 'ADMIN' ? 0.6 : 0.4, color: cardType === 'ADMIN' ? '#000' : '#fff', fontFamily: 'monospace' }}>UID NO.</div>
                                    <div style={{ fontSize: '10px', fontWeight: '700', color: cardType === 'ADMIN' ? '#000' : '#fff' }}>{selectedDevotee.uid}</div>
                                </div>
                                <div className="text-end">
                                    <div style={{ fontSize: '7px', opacity: cardType === 'ADMIN' ? 0.6 : 0.4, color: cardType === 'ADMIN' ? '#000' : '#fff', fontFamily: 'monospace' }}>VALIDITY</div>
                                    <div style={{ fontSize: '9px', fontWeight: '700', color: cardType === 'ADMIN' ? '#000' : '#fff' }}>{validFrom} - {validUpto}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn btn-pdf"
                        style={{ padding: '10px 40px', fontSize: '14px', borderRadius: '30px' }}
                        onClick={() => exportDevoteeCardPDF(selectedDevotee, festivalName, { cardType, gender, validFrom, validUpto, clubName, profileImage, bgMode, customColor, customGradient })}
                    >
                        Download Devotee Card (PDF)
                    </button>
                    <button className="btn" style={{ background: 'transparent', color: 'var(--muted)' }} onClick={() => setSelectedDevotee(null)}>
                        Clear Selection
                    </button>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
                    <div style={{ fontSize: '50px', marginBottom: '10px' }}>🆔</div>
                    <p>Search and select a devotee to view their card preview.</p>
                </div>
            )}
        </div>
    );
};

export default DevoteeCard;
