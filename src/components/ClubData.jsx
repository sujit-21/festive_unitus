import React, { useMemo, useState } from 'react';
import { decryptData } from '../utils/crypto';

function ClubData({ activeClubName, totalEntries, festivals }) {
    const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'unified'
    const [dataType, setDataType] = useState('devotees'); // 'devotees' or 'expenses'
    const [expandedFestivalId, setExpandedFestivalId] = useState(null);

    // Helper to get collection summary, devotees, and expenses for a festival
    const getFestivalData = (festivalId) => {
        const donationKey = `donationData_${festivalId}`;
        const encryptedDonations = localStorage.getItem(donationKey);
        let devotees = [];
        let donationTotal = 0;

        if (encryptedDonations) {
            const dec = decryptData(encryptedDonations);
            if (dec && Array.isArray(dec)) {
                devotees = dec;
                donationTotal = dec.reduce((sum, r) => sum + (Number(r.cash) || 0) + (Number(r.online) || 0) + (Number(r.coupon) || 0), 0);
            }
        }

        const expenseKey = `expenseData_${festivalId}`;
        const encryptedExpenses = localStorage.getItem(expenseKey);
        let expenses = [];
        let expenseTotal = 0;

        if (encryptedExpenses) {
            const dec = decryptData(encryptedExpenses);
            if (dec && Array.isArray(dec)) {
                expenses = dec;
                expenseTotal = dec.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
            }
        }

        return {
            donationTotal,
            donationEntries: devotees.length,
            devotees,
            expenseTotal,
            expenseEntries: expenses.length,
            expenses
        };
    };

    const clubHistory = useMemo(() => {
        if (!festivals || !activeClubName) return [];

        return festivals
            .filter(f => f.clubName === activeClubName)
            .map(f => {
                const dataInfo = getFestivalData(f.id);
                const yearMatch = f.name.match(/\d{4}/);
                const year = yearMatch ? yearMatch[0] : new Date(f.createdDate).getFullYear();

                return {
                    id: f.id,
                    name: f.name,
                    address: f.address || f.clubName || f.name,
                    year: year,
                    donationTotal: dataInfo.donationTotal,
                    donationEntries: dataInfo.donationEntries,
                    devotees: dataInfo.devotees,
                    expenseTotal: dataInfo.expenseTotal,
                    expenseEntries: dataInfo.expenseEntries,
                    expenses: dataInfo.expenses
                };
            })
            .sort((a, b) => b.year - a.year);
    }, [festivals, activeClubName]);

    const unifiedDevoteeDB = useMemo(() => {
        const yearsSet = new Set();
        const map = new Map();
        clubHistory.forEach(fes => {
            yearsSet.add(fes.year);
            fes.devotees.forEach(dev => {
                const uid = dev.uid || `no-uid-${dev.serial}`;
                if (!map.has(uid)) map.set(uid, { uid, name: dev.name, address: dev.address || '-', payments: {} });
                map.get(uid).payments[fes.year] = (map.get(uid).payments[fes.year] || 0) + (Number(dev.cash || 0) + Number(dev.online || 0) + Number(dev.coupon || 0));
            });
        });
        return { years: Array.from(yearsSet).sort((a, b) => b - a), records: Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)) };
    }, [clubHistory]);

    const unifiedExpenseDB = useMemo(() => {
        const yearsSet = new Set();
        const map = new Map();
        clubHistory.forEach(fes => {
            yearsSet.add(fes.year);
            fes.expenses.forEach(exp => {
                const itemName = (exp.item || 'Unnamed Expense').trim();
                const key = itemName.toLowerCase();
                if (!map.has(key)) map.set(key, { name: itemName, payments: {} });
                map.get(key).payments[fes.year] = (map.get(key).payments[fes.year] || 0) + Number(exp.amount || 0);
            });
        });
        return { years: Array.from(yearsSet).sort((a, b) => b - a), records: Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)) };
    }, [clubHistory]);

    const toggleExpand = (id) => {
        setExpandedFestivalId(expandedFestivalId === id ? null : id);
    };

    // Styling Constants for high visibility
    const styles = {
        segmentedControl: {
            display: 'flex',
            background: 'var(--card-bg, #f8fafc)',
            padding: '4px',
            borderRadius: '12px',
            border: '2px solid var(--border, #e2e8f0)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
            gap: '2px'
        },
        segmentBtn: (active, color) => ({
            flex: 1,
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: active ? color : 'transparent',
            color: active ? '#ffffff' : 'var(--text, #334155)',
            boxShadow: active ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
        }),
        subSegmentBtn: (active) => ({
            padding: '6px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: active ? 'var(--text, #1e293b)' : 'transparent',
            color: active ? '#ffffff' : 'var(--muted, #64748b)',
            boxShadow: active ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
        })
    };

    return (
        <div className="card club-dashboard-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)', opacity: 0.1, zIndex: 0 }}></div>

            <header style={{ position: 'relative', zIndex: 1, marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px', color: 'var(--text)' }}>
                            Club Dashboard
                        </h1>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--accent)', fontWeight: '600', fontSize: '14px' }}>
                            {activeClubName.toUpperCase()}
                        </p>
                    </div>

                    <div style={styles.segmentedControl}>
                        <button
                            style={styles.segmentBtn(dataType === 'devotees', 'var(--accent, #ff8a2b)')}
                            onClick={() => setDataType('devotees')}
                        >
                            <span role="img" aria-label="devotees">👥</span> Devotees
                        </button>
                        <button
                            style={styles.segmentBtn(dataType === 'expenses', '#ef4444')}
                            onClick={() => setDataType('expenses')}
                        >
                            <span role="img" aria-label="expenses">💸</span> Expenses
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', background: 'var(--card-bg, #f1f5f9)', padding: '3px', borderRadius: '10px', gap: '2px', border: '1px solid var(--border)' }}>
                        <button
                            style={styles.subSegmentBtn(viewMode === 'summary')}
                            onClick={() => setViewMode('summary')}
                        >
                            Yearly Summary
                        </button>
                        <button
                            style={styles.subSegmentBtn(viewMode === 'unified')}
                            onClick={() => setViewMode('unified')}
                        >
                            Unified Database
                        </button>
                    </div>
                </div>
            </header>

            <section className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', position: 'relative', zIndex: 1 }}>
                <div className="stat-card" style={{ padding: '20px', borderRadius: '16px', background: 'var(--card)', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div className="stat-number" style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text)' }}>{clubHistory.length}</div>
                    <div className="stat-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', marginTop: '4px' }}>Events</div>
                </div>
                <div className="stat-card" style={{ padding: '20px', borderRadius: '16px', background: 'var(--card)', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div className="stat-number" style={{ fontSize: '22px', fontWeight: '800', color: '#10b981' }}>₹{clubHistory.reduce((sum, h) => sum + h.donationTotal, 0).toLocaleString()}</div>
                    <div className="stat-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', marginTop: '4px' }}>Collections</div>
                </div>
                <div className="stat-card" style={{ padding: '20px', borderRadius: '16px', background: 'var(--card)', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div className="stat-number" style={{ fontSize: '22px', fontWeight: '800', color: '#ef4444' }}>₹{clubHistory.reduce((sum, h) => sum + h.expenseTotal, 0).toLocaleString()}</div>
                    <div className="stat-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', marginTop: '4px' }}>Expenses</div>
                </div>
            </section>

            <main style={{ marginTop: '30px', position: 'relative', zIndex: 1 }}>
                {viewMode === 'summary' ? (
                    <div className="card premium-table-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px' }}>{dataType === 'devotees' ? '📅' : '🧾'}</span>
                            {dataType === 'devotees' ? 'Donation History' : 'Expense Record'}
                        </h3>

                        <div className="table-wrapper" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
                                    <tr>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700' }}>Event / Year</th>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '700' }}>{dataType === 'devotees' ? 'Members' : 'Purchases'}</th>
                                        <th style={{ padding: '16px', textAlign: 'right', fontWeight: '700' }}>Amount</th>
                                        <th style={{ padding: '16px', textAlign: 'center', fontWeight: '700' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clubHistory.map((item, index) => (
                                        <React.Fragment key={item.id}>
                                            <tr style={{ borderTop: '1px solid var(--border)', transition: 'background 0.2s', background: expandedFestivalId === item.id ? 'var(--highlight, rgba(0,0,0,0.01))' : 'transparent' }}>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{item.year}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{item.name}</div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', color: 'var(--muted)', background: 'var(--border)' }}>
                                                        {dataType === 'devotees' ? `${item.donationEntries} Devotees` : `${item.expenseEntries} Items`}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: dataType === 'devotees' ? '#10b981' : '#ef4444' }}>
                                                    ₹{(dataType === 'devotees' ? item.donationTotal : item.expenseTotal).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px', background: 'var(--text)', color: 'var(--card)', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                                                        onClick={() => toggleExpand(item.id)}
                                                    >
                                                        {expandedFestivalId === item.id ? 'Close' : 'View Details'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedFestivalId === item.id && (
                                                <tr>
                                                    <td colSpan="4" style={{ padding: '0 16px 24px 16px', background: 'var(--highlight, rgba(0,0,0,0.01))' }}>
                                                        <div className="details-container" style={{ background: 'var(--card)', borderRadius: '12px', border: `1px solid ${dataType === 'devotees' ? 'var(--accent)' : '#ef4444'}`, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                                            <div style={{ background: dataType === 'devotees' ? 'var(--accent)' : '#ef4444', color: '#fff', padding: '10px 16px', fontSize: '12px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>{dataType === 'devotees' ? 'PARTICIPANT LIST' : 'EXPENSE BREAKDOWN'}</span>
                                                                <span>{item.year} - {item.name}</span>
                                                            </div>
                                                            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                                    <thead style={{ position: 'sticky', top: 0, background: '#fafafa', zIndex: 5, boxShadow: '0 1px 0 var(--border)' }}>
                                                                        <tr>
                                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700' }}>Description</th>
                                                                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>Amount</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {(dataType === 'devotees' ? item.devotees : item.expenses).map((rec, rIdx) => (
                                                                            <tr key={rIdx} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                                                                                <td style={{ padding: '12px' }}>
                                                                                    <div style={{ fontWeight: '600' }}>{dataType === 'devotees' ? rec.name : rec.item}</div>
                                                                                    {dataType === 'devotees' && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{rec.address || 'No Address'} | {rec.status}</div>}
                                                                                </td>
                                                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>
                                                                                    ₹{(dataType === 'devotees' ? (Number(rec.cash || 0) + Number(rec.online || 0) + Number(rec.coupon || 0)) : (rec.amount || 0)).toLocaleString()}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="card database-view-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>Unified Life-Cycle Database</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>Performance tracking across multiple years.</p>
                        </div>

                        <div className="table-wrapper" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0,0,0,0.04)' }}>
                                        <th style={{ padding: '16px', textAlign: 'left' }}>Item / Name</th>
                                        {(dataType === 'devotees' ? unifiedDevoteeDB : unifiedExpenseDB).years.map(year => (
                                            <th key={year} style={{ padding: '16px', textAlign: 'right' }}>{year}</th>
                                        ))}
                                        <th style={{ padding: '16px', textAlign: 'right', background: 'rgba(0,0,0,0.05)' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(dataType === 'devotees' ? unifiedDevoteeDB : unifiedExpenseDB).records.map((rec, index) => {
                                        const total = Object.values(rec.payments).reduce((s, a) => s + a, 0);
                                        return (
                                            <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ fontWeight: '700' }}>{rec.name}</div>
                                                    {dataType === 'devotees' && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>UID: {rec.uid} / {rec.address}</div>}
                                                </td>
                                                {(dataType === 'devotees' ? unifiedDevoteeDB : unifiedExpenseDB).years.map(year => (
                                                    <td key={year} style={{ padding: '16px', textAlign: 'right', fontWeight: rec.payments[year] ? '700' : 'normal', color: rec.payments[year] ? 'var(--text)' : '#d1d5db' }}>
                                                        {rec.payments[year] ? `₹${rec.payments[year].toLocaleString()}` : '—'}
                                                    </td>
                                                ))}
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '900', color: dataType === 'devotees' ? '#10b981' : '#ef4444', background: 'rgba(0,0,0,0.02)' }}>
                                                    ₹{total.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            <footer style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <p style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '500' }}>
                    © UNITUS Club Intelligence • Encrypted Local Storage Active
                </p>
            </footer>
        </div>
    );
}

export default ClubData;
