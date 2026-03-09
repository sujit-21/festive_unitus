import React, { useState, useEffect, useRef } from 'react';

const DonationForm = ({ onSave, editData, onCancelEdit, readOnlyAmount, onDownloadPDF, isAdmin }) => {

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        name: '',
        address: '',
        amount: '',
        paymentMethod: 'cash', // Default
        status: '',
        uid: ''
    });


    const nameInputRef = useRef(null);

    useEffect(() => {
        if (editData) {
            setFormData({
                date: editData.date || new Date().toISOString().split('T')[0],
                name: editData.name || '',
                address: editData.address || '',
                amount: editData.amount !== undefined ? editData.amount : '',
                paymentMethod: editData.paymentMethod || 'cash',
                status: editData.status || '',
                uid: editData.uid || ''
            });

            // Focus name on edit load
            setTimeout(() => {
                if (nameInputRef.current) nameInputRef.current.focus();
            }, 100);
        } else {
            // Reset to default date but keep today's date
            setFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0], name: '', address: '', amount: '', paymentMethod: 'cash', status: '' }));
        }
    }, [editData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || formData.name.length < 3) {
            alert("Name must be at least 3 characters");
            return;
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        onSave(formData);

        // Reset form if not editing (if editing, parent handles unmounting/resetting editData which triggers useEffect)
        if (!editData) {
            setFormData(prev => ({
                ...prev,
                name: '',
                address: '',
                amount: '',
                paymentMethod: 'cash',
                status: ''
            }));
        }
    };

    return (
        <div className="card">
            <div className="header-row">
                <h1>{editData ? 'Update Entry' : 'New Entry'}</h1>
            </div>
            <form id="donationForm" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div style={{ flexBasis: '100%', display: 'none' }}>
                        {/* Serial is handled by system */}
                    </div>
                    {formData.uid && (
                        <div style={{ flexBasis: '100%' }}>
                            <label>UID (System Generated)</label>
                            <input
                                type="text"
                                value={formData.uid}
                                readOnly
                                style={{ background: '#f3f4f6', cursor: 'not-allowed', fontFamily: 'monospace' }}
                            />
                        </div>
                    )}

                    <div>
                        <label>Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            min="2000-01-01"
                            required
                        />
                    </div>
                    <div style={{ flexBasis: '100%' }}>
                        <label>Name (English/Hindi)</label>
                        <input
                            type="text"
                            name="name"
                            ref={nameInputRef}
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter Donor Name"
                            required
                        />
                    </div>
                    <div style={{ flexBasis: '100%' }}>
                        <label>Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter Address"
                        />
                    </div>
                    <div>
                        <label>Amount (₹)</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            required
                            min="1"
                            disabled={readOnlyAmount}
                        />
                    </div>
                    <div>
                        <label>Payment Method</label>
                        <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} disabled={readOnlyAmount}>
                            <option value="cash">Cash</option>
                            <option value="online">Online</option>
                            <option value="due">Due</option>
                            <option value="coupon">20 R.S. Coupon</option>
                        </select>
                    </div>
                    {isAdmin && (
                        <div style={{ flexBasis: '100%' }}>
                            <label>Status</label>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option value="">No Status</option>
                                <option value="Prime">Prime</option>
                                <option value="Senior Member">Senior Member</option>
                            </select>
                        </div>
                    )}

                    <div style={{ flexBasis: '100%', display: 'flex', gap: '10px' }}>
                        {onDownloadPDF && editData && (
                            <button
                                type="button"
                                className="btn"
                                style={{ background: '#3b82f6', flex: 1 }}
                                onClick={() => onDownloadPDF(editData)}
                            >
                                📄 Download Subscription PDF
                            </button>
                        )}
                        {!readOnlyAmount && (
                            <button type="submit" className={`btn ${editData ? 'btn-update' : 'btn-add'}`} style={{ flex: 1 }}>
                                {editData ? 'Update Entry' : 'Add Entry'}
                            </button>
                        )}
                        {editData && !readOnlyAmount && (
                            <button type="button" className="btn btn-cancel" onClick={onCancelEdit} style={{ flex: 1 }}>
                                Cancel Update
                            </button>
                        )}
                    </div>

                </div>
            </form>
        </div>
    );
};

export default DonationForm;
