import React from 'react';

const formatCurrency = (num) => {
    return Number(num || 0).toLocaleString('hi-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
};

const Summary = ({ data, expenses, selectedYear, isAdmin }) => {
    // ... filtering logic ...
    const yearFilteredData = selectedYear === 'all' ? data : data.filter(item => {
        const itemYear = new Date(item.date).getFullYear().toString();
        return itemYear === selectedYear;
    });

    const yearFilteredExpenses = selectedYear === 'all' ? expenses : expenses.filter(item => {
        const itemYear = new Date(item.date).getFullYear().toString();
        return itemYear === selectedYear;
    });

    let totalCollection = 0;
    let totalDueAmount = 0;
    let seniorMemberTotal = 0;

    yearFilteredData.forEach(r => {
        totalCollection += (r.cash || 0) + (r.online || 0) + (r.coupon || 0);
        totalDueAmount += (r.due || 0);
        if (r.status === 'Senior Member') {
            seniorMemberTotal += (r.cash || 0) + (r.online || 0) + (r.coupon || 0);
        }
    });

    const totalExpenses = yearFilteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const remainingBalance = totalCollection - totalExpenses;

    // Progress Bar Calculation
    const totalPotential = totalCollection + totalDueAmount;
    const percent = totalPotential ? Math.min((totalCollection / totalPotential) * 100, 100) : 0;

    return (
        <div className="card">
            <div className="summary-grid">
                <div className="summary-item">
                    <div className="summary-label">Total Collection (Cash+Online)</div>
                    <div className="summary-value" style={{ color: '#10b981' }}>{formatCurrency(totalCollection)}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-label">Total Due Amount</div>
                    <div className="summary-value" style={{ color: '#ef4444' }}>{formatCurrency(totalDueAmount)}</div>
                </div>
                {isAdmin && (
                    <>
                        <div className="summary-item">
                            <div className="summary-label">Total Expenses</div>
                            <div className="summary-value" style={{ color: '#3b82f6' }}>{formatCurrency(totalExpenses)}</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-label">Remaining Balance</div>
                            <div className="summary-value" style={{ color: '#8b5cf6' }}>{formatCurrency(remainingBalance)}</div>
                        </div>
                    </>
                )}
                <div className="summary-item">
                    <div className="summary-label">Senior Member Total</div>
                    <div className="summary-value" style={{ color: '#f59e0b' }}>{formatCurrency(seniorMemberTotal)}</div>
                </div>
            </div>

            <div className="summary-label" style={{ marginTop: '10px' }}>Collection Progress</div>
            <div id="progressBar">
                <div id="progressFill" style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
};

export default Summary;
