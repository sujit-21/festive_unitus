import React, { useState, useEffect } from 'react';
import Summary from './components/Summary';
import DonationForm from './components/DonationForm';
import DataTable from './components/DataTable';
import Expenses from './components/Expenses';
import Gallery from './components/Gallery';
import Contact from './components/Contact';
import About from './components/About';
import Settings from './components/Settings';
import DevoteeCard from './components/DevoteeCard';
import ClubData from './components/ClubData'; // Import ClubData

import Login from './components/Login';
import Signup from './components/Signup';
import UserManagement from './components/UserManagement'; // Import UserManagement
import { useDataPersistence } from './hooks/useDataPersistence';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './context/AuthContext';
import { useFestival } from './context/FestivalContext'; // Import useFestival
import { db } from './services/db'; // Import db
import { exportDonationPDF, exportDonationCSV, exportIndividualPDF } from './utils/export';

// Helper to generate Alphanumeric UID (12 chars: A-Z, a-z, 0-9, @, _)
const generateUID = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@_';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

function App() {

  const { user, logout, loading: authLoading } = useAuth();
  const {
    festivals,
    activeFestivalId,
    createFestival,
    switchFestival,
    deleteFestival,
    updateFestival,
    loading: festivalLoading
  } = useFestival();

  const [authView, setAuthView] = useState('login');

  const {
    data,
    expenses,
    isLoading,
    saveData,
    saveExpenses,
    gallery,
    contacts,
    aboutContent,
    saveGallery,
    saveContacts,
    saveAbout,
    backupData,
    restoreData
  } = useDataPersistence();


  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('home');
  const [homeSubTab, setHomeSubTab] = useState('donation'); // 'donation' or 'expense'
  const [editData, setEditData] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: '', visible: false });
  const [selectedYear, setSelectedYear] = useState('all');
  const [showFestivalModal, setShowFestivalModal] = useState(false);

  useEffect(() => {
    if (user && !activeFestivalId && !festivalLoading) {
      setShowFestivalModal(true);
    }
  }, [user, activeFestivalId, festivalLoading]);



  // Computed data based on role
  const isAdmin = user?.role === 'admin';

  // If user is not admin, they only see their own data
  const userSpecificData = data.filter(d => d.uid === user?.uid);
  const effectiveData = isAdmin ? data : userSpecificData;


  // Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!user) return;

      // Alt + S: Search (Go to Database) - Admin only
      if (isAdmin && e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setActiveTab('database');
        setTimeout(() => {
          const el = document.getElementById('searchInput');
          if (el) el.focus();
        }, 100);
      }
      // Alt + U: Update (Go to Home/Form)
      if (e.altKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        setActiveTab('home');
        setTimeout(() => {
          const el = document.querySelector('input[name="name"]');
          if (el) el.focus();
        }, 100);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [user, isAdmin]);

  // Migration: Add UID to existing records that don't have it
  useEffect(() => {
    if (!isLoading && data.length > 0) {
      const needsMigration = data.some(d => !d.uid);
      if (needsMigration) {
        const migratedData = data.map(d => ({
          ...d,
          uid: d.uid || generateUID()
        }));
        saveData(migratedData);
      }
    }
  }, [isLoading, data, saveData]);



  const showToast = (msg, type = 'success') => {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  // Handlers
  const handleSaveDonation = (formData) => {
    // Permission check
    if (!isAdmin && editData && editData.uid !== user.uid) {
      showToast("You can only edit your own data.", "error");
      return;
    }


    const newData = [...data];
    const cash = formData.paymentMethod === 'cash' ? parseFloat(formData.amount) : 0;
    const online = formData.paymentMethod === 'online' ? parseFloat(formData.amount) : 0;
    const due = formData.paymentMethod === 'due' ? parseFloat(formData.amount) : 0;
    const coupon = formData.paymentMethod === 'coupon' ? parseFloat(formData.amount) : 0;

    const entry = {
      uid: (editData && editData.uid) ? editData.uid : generateUID(),
      date: formData.date,
      name: formData.name,
      address: formData.address,
      status: formData.status,
      cash, online, due, coupon
    };


    if (editData && editIndex !== null) {
      // Update
      entry.serial = editData.serial;
      // If user is editing their own data, ensure they don't change serial? (Logic handled in form mostly)

      const actualIndex = newData.findIndex(d => d.serial === editData.serial);
      if (actualIndex !== -1) {
        newData[actualIndex] = { ...newData[actualIndex], ...entry };
        showToast("Entry updated successfully!");
      }
      setEditData(null);
      setEditIndex(null);
    } else {
      // Add
      // Only Admin can add NEW records? Or users can add themselves? 
      // User flow: Signup -> (No data) -> Add Data -> Linked to UID?
      // Logic for linking user to new data:
      if (!isAdmin && user.uid) {
        showToast("You already have an entry. Edit it.", "error");
        return;
      }


      entry.serial = data.length + 1;
      newData.push(entry);
      showToast("Entry added successfully!");
    }
    saveData(newData);
  };

  const handleDeleteDonation = (serial) => {
    if (!isAdmin) {
      showToast("Only admin can delete entries.", "error");
      return;
    }
    const newData = data.filter(d => d.serial !== serial);
    // Re-index serials but KEEP uids stable
    const reindexedData = newData.map((d, i) => ({ ...d, serial: i + 1 }));
    saveData(reindexedData);

    showToast("Entry deleted successfully!");
  };

  const handleEditDonation = (item) => {
    // Check permission
    if (!isAdmin && item.uid !== user.uid) {
      showToast("Access Denied", "error");
      return;
    }


    setEditData({
      ...item,
      amount: (item.cash || item.online || item.due || item.coupon || 0),
      paymentMethod: item.cash ? 'cash' : item.online ? 'online' : item.due ? 'due' : 'coupon'
    });
    setEditIndex(data.findIndex(d => d.serial === item.serial));
    setActiveTab('home');
  };

  const handleCancelEdit = () => {
    setEditData(null);
    setEditIndex(null);
  };

  const handleSaveExpense = (expenseData) => {
    if (!isAdmin) {
      showToast("Only admins can manage expenses", "error");
      return;
    }
    const newExpenses = [...expenses];
    if (expenseData.id) {
      const idx = newExpenses.findIndex(e => e.serial === expenseData.id);
      if (idx !== -1) {
        newExpenses[idx] = {
          ...newExpenses[idx],
          date: expenseData.date,
          item: expenseData.item,
          amount: expenseData.amount,
          category: expenseData.category,
          billNo: expenseData.billNo,
          paymentMethod: expenseData.paymentMethod
        };
        showToast("Expense updated!");
      }
    } else {
      newExpenses.push({
        serial: expenses.length > 0 ? Math.max(...expenses.map(e => e.serial)) + 1 : 1,
        date: expenseData.date,
        item: expenseData.item,
        amount: expenseData.amount,
        category: expenseData.category,
        billNo: expenseData.billNo,
        paymentMethod: expenseData.paymentMethod
      });
      showToast("Expense added!");
    }
    saveExpenses(newExpenses);
  };

  const handleDeleteExpense = (id) => {
    if (!isAdmin) return;
    const newExpenses = expenses.filter(e => e.serial !== id);
    const reindexed = newExpenses.map((e, i) => ({ ...e, serial: i + 1 }));
    saveExpenses(reindexed);
    showToast("Expense deleted!");
  };

  const handleExportPDF = (currentView) => {
    exportDonationPDF(effectiveData, expenses, currentView, selectedYear, calculateSummary(), activeFestivalName);
  };

  const handleExportIndividualPDF = (row) => {
    // Find linked user credentials via unique UID
    const allUsers = db.getUsers();
    const linkedUser = allUsers.find(u => u.uid === row.uid);
    exportIndividualPDF(row, linkedUser, activeFestivalName);
  };


  const normalizeRecord = (item) => {
    if (!item) return null;
    return {
      ...item,
      amount: item.amount !== undefined ? item.amount : (item.cash || item.online || item.due || item.coupon || 0),
      paymentMethod: item.paymentMethod || (item.cash ? 'cash' : item.online ? 'online' : item.due ? 'due' : 'coupon')
    };
  };

  const calculateSummary = () => {
    const filteredData = selectedYear === 'all' ? effectiveData : effectiveData.filter(item => new Date(item.date).getFullYear().toString() === selectedYear);
    const filteredExpenses = selectedYear === 'all' ? expenses : expenses.filter(item => new Date(item.date).getFullYear().toString() === selectedYear);

    let totalCollection = 0;
    let totalDue = 0;
    let seniorTotal = 0;

    filteredData.forEach(r => {
      totalCollection += (r.cash || 0) + (r.online || 0) + (r.coupon || 0);
      totalDue += (r.due || 0);
      if (r.status === 'Senior Member') {
        seniorTotal += (r.cash || 0) + (r.online || 0) + (r.coupon || 0);
      }
    });
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      totalCollection,
      totalDue,
      totalExpenses,
      balance: totalCollection - totalExpenses,
      seniorTotal
    };
  };

  const handleRestore = async (e) => {
    if (!isAdmin) return;
    try {
      await restoreData(e.target.files[0]);
      showToast("Data restored successfully!");
    } catch (err) {
      showToast("Error restoring data: " + err, "error");
    }
  };

  // Festival Handlers
  const handleCreateFestival = (e) => {
    e.preventDefault();
    const name = e.target.festivalName.value;
    const clubName = e.target.clubName.value;
    const address = e.target.address.value;
    if (name && clubName) {
      createFestival(name, clubName, address || clubName);
      setShowFestivalModal(false);
      showToast(`Created: ${name} (${clubName})`);
    } else if (name) {
      createFestival(name, name, name);
      setShowFestivalModal(false);
      showToast(`Created: ${name}`);
    }
  };


  if (authLoading || isLoading || festivalLoading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  if (!user) {
    if (authView === 'signup') {
      return <Signup toggleView={() => setAuthView('login')} />;
    }
    return <Login toggleView={() => setAuthView('signup')} />;
  }

  const activeFestival = festivals.find(f => f.id === activeFestivalId);
  const activeFestivalName = activeFestival?.name || 'Unknown Festival';
  const activeClubName = activeFestival?.clubName || activeFestivalName;

  return (
    <div className="page">
      {/* Toast */}
      {toast.visible && (
        <div className={`toast`} style={{
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981',
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          color: '#fff', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', zIndex: 9999
        }}>
          {toast.msg}
        </div>
      )}

      {/* Festival Switcher Modal */}
      {showFestivalModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '400px', padding: '20px' }}>
            <h3>Manage Festivals</h3>

            <div style={{ marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
              {festivals.map(f => (
                <div key={f.id} style={{
                  padding: '10px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: f.id === activeFestivalId ? 'var(--bg-secondary)' : 'transparent'
                }}>
                  <div
                    onClick={() => { switchFestival(f.id); setShowFestivalModal(false); }}
                    style={{ flex: 1, cursor: 'pointer', fontWeight: f.id === activeFestivalId ? 'bold' : 'normal' }}
                  >
                    <div style={{ fontSize: '14px' }}>{f.name}</div>
                    <div style={{ fontSize: '10px', opacity: 0.6 }}>{f.clubName || f.name}</div>
                    <div style={{ fontSize: '9px', opacity: 0.4 }}>{f.address || f.clubName}</div>
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn" style={{ background: '#3b82f6', padding: '5px 10px', fontSize: '12px', minWidth: '50px' }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newName = window.prompt(`Enter new NAME for "${f.name}":`, f.name);
                          const newClubName = window.prompt(`Enter new CLUB NAME for "${f.name}":`, f.clubName || f.name);
                          const newAddress = window.prompt(`Enter new ADDRESS for "${f.name}":`, f.address || f.clubName || f.name);

                          if (newClubName.trim() === "") {
                            if (window.confirm("Deleting the CLUB NAME will delete this entire festival and its data. Proceed?")) {
                              deleteFestival(f.id);
                            }
                          } else {
                            updateFestival(f.id, newName.trim() || f.name, newClubName.trim(), newAddress || newClubName.trim());
                          }
                        }}>
                        Edit
                      </button>
                      {f.id !== activeFestivalId && (
                        <button className="btn" style={{ background: '#ef4444', padding: '5px 10px', fontSize: '12px', minWidth: '50px' }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete "${f.name}"?`)) {
                              deleteFestival(f.id);
                            }
                          }}>
                          Del
                        </button>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>

            {isAdmin && (
              <form onSubmit={handleCreateFestival} style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Festival & Event Name</label>
                  <input name="festivalName" required placeholder="Ex: Ganesh Puja 2026" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Club Name (Mandatory)</label>
                  <input
                    name="clubName"
                    required
                    placeholder="Ex: Young Star Club"
                    defaultValue={isAdmin ? user.clubName : ""}
                    readOnly={isAdmin}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: isAdmin ? 'var(--bg-secondary)' : 'white'
                    }}
                    onChange={(e) => {
                      const addrInput = e.target.form.address;
                      if (!addrInput.dataset.edited) {
                        addrInput.value = e.target.value;
                      }
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Address (Mandatory)</label>
                  <input
                    name="address"
                    required
                    placeholder="Ex: Main Road, Sector 5"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    onInput={(e) => e.target.dataset.edited = true}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Festival & Event</button>
              </form>
            )}


            <button className="btn" style={{ marginTop: '20px', width: '100%', background: '#6b7280' }} onClick={() => setShowFestivalModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card header-row" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap' }}>

        {/* Left: Role and Entry Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <span style={{ fontSize: '10px', opacity: 0.7 }}>({user.role === 'admin' ? 'Admin' : 'Member'})</span>
          {isAdmin && <span id="recordCount" style={{ fontSize: '10px', opacity: 0.7 }}>({effectiveData.length} entries)</span>}
        </div>

        {/* Center: App Name */}
        <h1 style={{ flex: 1, display: 'flex', justifyContent: 'center', margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '1px' }}>
          UNITUS
        </h1>

        {/* Right: Festival Selector and Buttons */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
          {/* Festival Selector Display */}
          <div
            onClick={() => setShowFestivalModal(true)}
            style={{
              padding: '5px 10px', backgroundColor: 'var(--bg-secondary)',
              borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: '1.2'
            }}
          >
            <div style={{ fontSize: '12px' }}>
              <span style={{ opacity: 0.7 }}>Fest:</span> <strong>{activeFestivalName}</strong>
            </div>
            <div style={{ fontSize: '10px', opacity: 0.5 }}>
              Club: {activeClubName}
            </div>
          </div>

          <div className="buttons" style={{ margin: 0 }}>
            <button className="btn" style={{ background: '#ef4444' }} onClick={logout}>Logout</button>
            {isAdmin && (
              <>
                <button className="btn btn-csv" onClick={() => exportDonationCSV(effectiveData, 'all', selectedYear, activeFestivalName)}>CSV</button>
                <div className="export-dropdown" onMouseEnter={e => e.currentTarget.querySelector('.export-dropdown-content').classList.add('show')} onMouseLeave={e => e.currentTarget.querySelector('.export-dropdown-content').classList.remove('show')}>
                  <button className="btn btn-pdf" style={{ margin: 0 }}>PDF ▼</button>
                  <div className="export-dropdown-content">
                    <div className="export-dropdown-item" onClick={() => handleExportPDF('all')}>All Payments</div>
                    <div className="export-dropdown-item" onClick={() => handleExportPDF('paid')}>Paid Only</div>
                    <div className="export-dropdown-item" onClick={() => handleExportPDF('due')}>Due Only</div>
                    <div className="export-dropdown-item" onClick={() => handleExportPDF('expenses')}>Expenses</div>
                  </div>
                </div>
                <button className="btn btn-backup" onClick={backupData} title="Backup Data">Backup</button>
              </>
            )}
            <button className="btn" style={{ background: '#6b7280' }} onClick={() => setActiveTab('settings')}>⚙️</button>
          </div>
        </div>
      </div>

      <Summary data={effectiveData} expenses={isAdmin ? expenses : []} selectedYear={selectedYear} isAdmin={isAdmin} />


      {/* Tabs Navigation */}
      <div className="tabs">
        <button className={`tab-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>My Entry</button>
        {isAdmin && <button className={`tab-link ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>Database</button>}
        {isAdmin && <button className={`tab-link ${activeTab === 'devoteeCard' ? 'active' : ''}`} onClick={() => setActiveTab('devoteeCard')}>Devotee Card</button>}
        {isAdmin && <button className={`tab-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Credentials</button>}
        {isAdmin && <button className={`tab-link ${activeTab === 'clubData' ? 'active' : ''}`} onClick={() => setActiveTab('clubData')}>ClubData</button>}
        <button className={`tab-link ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>Gallery</button>
        <button className={`tab-link ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>Contact</button>
        <button className={`tab-link ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>About</button>
        <button className={`tab-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
      </div>


      {/* Tab Content */}
      <div className="tab-content" style={{ display: activeTab === 'home' ? 'block' : 'none' }}>

        {/* Sub-tabs for My Entry */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary, #f1f5f9)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '15px',
          gap: '4px',
          border: '1px solid var(--border)'
        }}>
          <button
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              background: homeSubTab === 'donation' ? 'var(--accent)' : 'transparent',
              color: homeSubTab === 'donation' ? '#fff' : 'var(--muted)'
            }}
            onClick={() => setHomeSubTab('donation')}
          >
            Donation Entry
          </button>
          {isAdmin && (
            <button
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                background: homeSubTab === 'expense' ? '#ef4444' : 'transparent',
                color: homeSubTab === 'expense' ? '#fff' : 'var(--muted)'
              }}
              onClick={() => setHomeSubTab('expense')}
            >
              Expense Entry
            </button>
          )}

        </div>

        {homeSubTab === 'donation' ? (
          <>
            {(!isAdmin && userSpecificData.length === 0 && !editData) && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <h3>Welcome, {user.username}!</h3>
                <p>You haven't linked your account to a donation record yet.</p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
                  <button className="btn btn-add" onClick={() => handleSaveDonation({
                    date: new Date().toISOString().split('T')[0], name: user.username, address: '', status: 'Active Member',
                    paymentMethod: 'cash', amount: 0
                  })}>Create New Record</button>
                </div>

                <hr style={{ margin: '20px 0', borderColor: 'var(--border)' }} />

                <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
                  <h4 style={{ marginTop: 0 }}>Or Link Existing Record</h4>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const inputUid = formData.get('linkUid');
                    const record = data.find(d => d.uid === inputUid);
                    if (record) {
                      const users = db.getUsers();
                      const userIdx = users.findIndex(u => u.username === user.username);
                      if (userIdx !== -1) {
                        users[userIdx].uid = inputUid;
                        db.saveUsers(users);
                        alert("Record Linked! Please log in again to see changes.");
                        logout();
                      }
                    } else {
                      alert("Record not found with that UID.");
                    }
                  }}>
                    <div style={{ marginBottom: '10px', textAlign: 'left' }}>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Donation UID</label>
                      <input name="linkUid" type="text" required style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
                    </div>
                    <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>Link Record</button>
                  </form>
                </div>
              </div>
            )}

            {(isAdmin || editData || userSpecificData.length > 0) && (
              <DonationForm
                onSave={handleSaveDonation}
                editData={normalizeRecord(editData || (!isAdmin && userSpecificData.length > 0 ? userSpecificData[0] : null))}
                onCancelEdit={handleCancelEdit}
                readOnlyAmount={!isAdmin}
                onDownloadPDF={(record) => handleExportIndividualPDF(record)}
                isAdmin={isAdmin}
              />


            )}
          </>
        ) : (
          <Expenses
            expenses={expenses}
            onSave={handleSaveExpense}
            onDelete={handleDeleteExpense}
            isAdmin={isAdmin}
          />
        )}
      </div>

      <div className="tab-content" style={{ display: activeTab === 'database' ? 'block' : 'none' }}>
        <DataTable
          data={effectiveData}
          onEdit={handleEditDonation}
          onDelete={handleDeleteDonation}
          onExportPDF={handleExportPDF}
          onExportIndividualPDF={handleExportIndividualPDF}
          yearFilter={selectedYear}
          onYearFilterChange={setSelectedYear}
        />
      </div>


      {isAdmin && (
        <div className="tab-content" style={{ display: activeTab === 'devoteeCard' ? 'block' : 'none' }}>
          <DevoteeCard data={effectiveData} festivalName={activeFestivalName} clubName={activeClubName} />
        </div>
      )}

      {isAdmin && (
        <div className="tab-content" style={{ display: activeTab === 'users' ? 'block' : 'none' }}>
          <UserManagement showToast={showToast} />
        </div>
      )}

      {isAdmin && (
        <div className="tab-content" style={{ display: activeTab === 'clubData' ? 'block' : 'none' }}>
          <ClubData activeClubName={activeClubName} totalEntries={effectiveData.length} festivals={festivals} />
        </div>
      )}

      <div className="tab-content" style={{ display: activeTab === 'gallery' ? 'block' : 'none' }}>
        <Gallery
          gallery={gallery}
          onSave={saveGallery}
          isAdmin={isAdmin}
        />
      </div>

      <div className="tab-content" style={{ display: activeTab === 'contact' ? 'block' : 'none' }}>
        <Contact
          contacts={contacts}
          onSave={saveContacts}
          isAdmin={isAdmin}
        />
      </div>

      <div className="tab-content" style={{ display: activeTab === 'about' ? 'block' : 'none' }}>
        <About
          content={aboutContent}
          onSave={saveAbout}
          isAdmin={isAdmin}
        />
      </div>

      <div className="tab-content" style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>

        <Settings
          onBackup={backupData}
          onRestore={handleRestore}
          toggleTheme={toggleTheme}
          theme={theme}
          isAdmin={isAdmin}
        />
      </div>

      {/* Scroll to top FAB */}
      <button
        className="fab secondary"
        style={{ display: 'none' }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ⬆️
      </button>
    </div>
  );
}

export default App;
