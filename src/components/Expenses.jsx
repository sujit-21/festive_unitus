import React, { useState } from 'react';

const formatCurrency = (num) => {
    return Number(num || 0).toLocaleString('hi-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
};

const EXPENSE_CATEGORIES = [
    'Decoration',
    'Food & Catering',
    'Sound & Light',
    'Tent & Seating',
    'Prize & Awards',
    'Donation/Gift',
    'Marketing/Ads',
    'Miscellaneous'
];

const Expenses = ({ expenses, onSave, onDelete, isAdmin }) => {
    const [formData, setFormData] = useState({
        id: null, // serial
        date: new Date().toISOString().split('T')[0],
        item: '',
        amount: '',
        category: 'Miscellaneous',
        billNo: '',
        paymentMethod: 'cash'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.item || !formData.amount) return;

        onSave({
            ...formData,
            amount: parseFloat(formData.amount)
        });
        resetForm();
    };

    const handleEdit = (expense) => {
        if (!isAdmin) return; // Only admin can edit
        setFormData({
            id: expense.serial,
            date: expense.date,
            item: expense.item,
            amount: expense.amount,
            category: expense.category || 'Miscellaneous',
            billNo: expense.billNo || '',
            paymentMethod: expense.paymentMethod || 'cash'
        });
        setIsEditing(true);
        document.querySelector('.form-grid').scrollIntoView({ behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({
            id: null,
            date: new Date().toISOString().split('T')[0],
            item: '',
            amount: '',
            category: 'Miscellaneous',
            billNo: '',
            paymentMethod: 'cash'
        });
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this expense?")) {
            onDelete(formData.id);
            resetForm();
        }
    };

    const filteredExpenses = expenses.filter(exp =>
        exp.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.category && exp.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exp.billNo && exp.billNo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="expenses-container">
            {isAdmin && (
                <div className="card" id="expensePopup" style={{ marginBottom: '20px', borderTop: '4px solid #ef4444' }}>
                    <div className="header-row">
                        <h1><span role="img" aria-label="expense">💸</span> {isEditing ? 'Update Expense' : 'Add New Expense'}</h1>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div>
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div style={{ flexBasis: '100%' }}>
                                <label>Item / Description</label>
                                <input
                                    type="text"
                                    value={formData.item}
                                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                                    placeholder="e.g. Flowers for stage, Catering advance"
                                    required
                                />
                            </div>
                            <div>
                                <label>Amount (₹)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    required
                                    min="0"
                                />
                            </div>
                            <div>
                                <label>Bill / Ref No.</label>
                                <input
                                    type="text"
                                    value={formData.billNo}
                                    onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label>Payment Mode</label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="online">Online</option>
                                </select>
                            </div>

                            <div style={{ flexBasis: '100%', display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" className={`btn ${isEditing ? 'btn-expense-update' : 'btn-expense-add'}`} style={{ flex: 1 }}>
                                    {isEditing ? 'Update Expense' : 'Save Expense'}
                                </button>
                                {isEditing && (
                                    <button type="button" className="btn btn-expense-delete" onClick={handleDelete} style={{ flex: 1 }}>
                                        Delete
                                    </button>
                                )}
                                {isEditing && (
                                    <button type="button" className="btn btn-cancel" onClick={resetForm} style={{ flex: 1 }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="header-row" style={{ marginBottom: '15px' }}>
                    <h1 style={{ fontSize: '18px' }}>Expense Database</h1>
                    <div className="search-container" style={{ maxWidth: '300px' }}>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="🔍 Search expenses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Item</th>
                                <th>Ref</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>No records found matching your search</td></tr>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <tr
                                        key={expense.serial}
                                        className="expense-row"
                                        onClick={() => handleEdit(expense)}
                                        style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                                    >
                                        <td data-label="No">{expense.serial}</td>
                                        <td data-label="Date">{new Date(expense.date).toLocaleDateString('en-IN')}</td>
                                        <td data-label="Category">
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                fontWeight: '700',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444'
                                            }}>
                                                {expense.category || 'Misc'}
                                            </span>
                                        </td>
                                        <td data-label="Item" style={{ fontWeight: '600' }}>{expense.item}</td>
                                        <td data-label="Ref" style={{ opacity: 0.6, fontSize: '11px' }}>{expense.billNo || '-'}</td>
                                        <td data-label="Amount" style={{ fontWeight: '800', color: '#ef4444' }}>{formatCurrency(expense.amount)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {filteredExpenses.length > 0 && (
                            <tfoot>
                                <tr style={{ background: 'var(--bg)', fontWeight: '800' }}>
                                    <td colSpan="5" style={{ textAlign: 'right', padding: '12px' }}>Grand Total:</td>
                                    <td style={{ color: '#ef4444', padding: '12px' }}>
                                        {formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.amount, 0))}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Expenses;

