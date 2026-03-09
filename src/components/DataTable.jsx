import React, { useState, useEffect } from 'react';

const formatCurrency = (num) => {
    return Number(num || 0).toLocaleString('hi-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
};

const DataTable = ({
    data,
    onEdit,
    onDelete,
    onExportPDF, // Generic export function passed from parent
    onExportIndividualPDF,
    yearFilter,
    onYearFilterChange
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewType, setViewType] = useState('all');
    // yearFilter state lifted up
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationEnabled, setPaginationEnabled] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const rowsPerPage = 50;

    // Extract available years
    const availableYears = Array.from(new Set(data.map(item => new Date(item.date).getFullYear()))).sort((a, b) => b - a);

    // Filtering Logic
    const filteredData = data.filter(item => {
        // Year Filter
        if (yearFilter !== 'all') {
            const itemYear = new Date(item.date).getFullYear().toString();
            if (itemYear !== yearFilter) return false;
        }

        // View Type Filter
        if (viewType === 'paid') {
            if (!((item.cash && item.cash > 0) || (item.online && item.online > 0) || (item.coupon && item.coupon > 0))) return false;
        } else if (viewType === 'due') {
            if (!(item.due && item.due > 0)) return false;
        }

        // Search Filter
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            const amount = (item.cash || item.online || item.due || item.coupon || 0).toString();
            return (
                item.name.toLowerCase().includes(q) ||
                item.address?.toLowerCase().includes(q) ||
                item.date.includes(q) ||
                amount.includes(q) ||
                item.status?.toLowerCase().includes(q)
            );
        }

        return true;
    });

    // Calculate Search Suggestions
    const suggestions = searchTerm && showSuggestions
        ? data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
        : [];

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setShowSuggestions(true);
        setCurrentPage(1);
    };

    const handleSuggestionClick = (name) => {
        setSearchTerm(name);
        setShowSuggestions(false);
    };

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const displayedData = paginationEnabled
        ? filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
        : filteredData;

    // Helper for row classes
    const getRowClass = (r) => {
        let classes = [];
        if (r.cash > 0) classes.push('cash-row');
        else if (r.online > 0) classes.push('online-row');
        else if (r.due > 0) classes.push('due-row');
        else if (r.coupon > 0) classes.push('coupon-row');

        if (r.status === 'Prime') classes.push('prime-row');
        else if (r.status === 'Senior Member') classes.push('senior-row');

        return classes.join(' ');
    };

    const getPaymentMethodLabel = (r) => {
        if (r.cash > 0) return <span className="payment-pill payment-cash">Cash</span>;
        if (r.online > 0) return <span className="payment-pill payment-online">Online</span>;
        if (r.due > 0) return <span className="payment-pill payment-due">Due</span>;
        if (r.coupon > 0) return <span className="payment-pill payment-coupon">20 R.S. Coupon</span>;
        return null;
    };

    const getStatusLabel = (r) => {
        if (!r.status) return null;
        const cls = r.status === 'Prime' ? 'status-prime' : r.status === 'Senior Member' ? 'status-senior' : '';
        return <span className={`status-pill ${cls}`}>{r.status}</span>;
    };

    // Click on row to edit
    const handleRowClick = (item) => {
        onEdit(item);
    };

    return (
        <div>
            <div className="card" style={{ marginBottom: '10px' }}>
                <div className="form-grid" style={{ alignItems: 'end' }}>
                    <div className="search-container" style={{ flexGrow: 2 }}>
                        <label>Search</label>
                        <input
                            type="text"
                            id="searchInput"
                            placeholder="Search by Name, Date, Amount..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                        {suggestions.length > 0 && (
                            <div className="search-suggestions" style={{ display: 'block' }}>
                                {suggestions.map((s, i) => (
                                    <div key={i} className="search-suggestion" onClick={() => handleSuggestionClick(s.name)}>
                                        {s.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label>Year Filter</label>
                        <select value={yearFilter} onChange={(e) => onYearFilterChange(e.target.value)}>
                            <option value="all">All Years</option>
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>View Type</label>
                        <select value={viewType} onChange={(e) => setViewType(e.target.value)}>
                            <option value="all">All Entries</option>
                            <option value="paid">Paid Only</option>
                            <option value="due">Due Only</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn" onClick={() => setPaginationEnabled(!paginationEnabled)} title={paginationEnabled ? "Disable Pagination" : "Enable Pagination"}>
                            {paginationEnabled ? '📋 All' : '📄 Page'}
                        </button>
                        {/* Placeholder for export buttons passed from outside if needed, or handle here */}
                    </div>
                </div>
                <div className="pagination-info">
                    Showing {filteredData.length} entries {yearFilter !== 'all' ? `for year ${yearFilter}` : ''}
                </div>
            </div>

            <div className="table-wrap" id="dataTable">
                <table>
                    <thead id="tableHead">
                        <tr>
                            <th>Serial</th>
                            <th>UID</th>
                            <th>Date</th>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>

                    </thead>
                    <tbody>
                        {displayedData.length === 0 ? (
                            <tr><td colSpan="10" className="empty-state">No data available</td></tr>
                        ) : (

                            displayedData.map((row) => {
                                const amount = row.cash || row.online || row.due || row.coupon || 0;
                                return (
                                    <tr key={row.serial} className={getRowClass(row)} onClick={() => handleRowClick(row)}>
                                        <td data-label="Serial">{row.serial}</td>
                                        <td data-label="UID" style={{ fontSize: '10px', fontFamily: 'monospace' }}>{row.uid}</td>
                                        <td data-label="Date">{row.date}</td>

                                        <td data-label="Name" style={{ fontWeight: 'bold' }}>{row.name}</td>
                                        <td data-label="Address">{row.address}</td>
                                        <td data-label="Amount" style={{ fontWeight: 'bold' }}>{formatCurrency(amount)}</td>
                                        <td data-label="Method">{getPaymentMethodLabel(row)}</td>
                                        <td data-label="Status">{getStatusLabel(row)}</td>
                                        <td data-label="Action" onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                                <button className="btn btn-pdf" style={{ padding: '2px 5px', minHeight: 'auto', fontSize: '9px' }} onClick={() => onExportIndividualPDF(row)}>PDF</button>
                                                <button className="btn btn-delete" style={{ padding: '2px 5px', minHeight: 'auto', fontSize: '9px' }} onClick={() => {
                                                    if (confirm(`Delete entry for ${row.name}?`)) onDelete(row.serial);
                                                }}>Del</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {paginationEnabled && totalPages > 1 && (
                <div className="pagination" id="paginationControls">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
                </div>
            )}
        </div>
    );
};

export default DataTable;
