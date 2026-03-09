import { useState, useEffect } from 'react';
import { encryptData, decryptData } from '../utils/crypto';
import { useFestival } from '../context/FestivalContext';

export const useDataPersistence = () => {
    const { activeFestivalId, loading: festivalLoading } = useFestival();

    const [data, setData] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [aboutContent, setAboutContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const baseDonationKey = 'donationData';
    const baseExpenseKey = 'expenseData';
    const baseGalleryKey = 'galleryData';
    const baseContactsKey = 'contactsData';
    const baseAboutKey = 'aboutData';
    const baseBackupKey = 'autoBackup_v1';

    // Helper to get namespaced key
    const getKey = (base) => activeFestivalId ? `${base}_${activeFestivalId}` : null;

    // Load data
    useEffect(() => {
        if (festivalLoading || !activeFestivalId) return;

        setIsLoading(true);
        // Reset state for new festival to avoid stale data flash
        setData([]);
        setExpenses([]);
        setGallery([]);
        setContacts([]);
        setAboutContent('');

        // Function helpers
        const load = (key, setter) => {
            try {
                const encrypted = localStorage.getItem(key);
                if (encrypted) {
                    const decrypted = decryptData(encrypted);
                    if (decrypted) setter(decrypted);
                }
            } catch (e) {
                console.error(`Error loading ${key}`, e);
            }
        };

        try {
            // Must define keys inside effect or use memoized helper? using getKey directly is fine
            load(getKey(baseDonationKey), setData);
            load(getKey(baseExpenseKey), setExpenses);
            load(getKey(baseGalleryKey), setGallery);
            load(getKey(baseContactsKey), setContacts);
            load(getKey(baseAboutKey), setAboutContent);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeFestivalId, festivalLoading]);

    // Save data helper
    const saveData = (newData) => {
        if (!activeFestivalId) return;
        try {
            setData(newData);
            const encrypted = encryptData(newData);
            localStorage.setItem(getKey(baseDonationKey), encrypted);
        } catch (error) {
            console.error("Error saving data:", error);
        }
    };

    // Save expense helper
    const saveExpenses = (newExpenses) => {
        if (!activeFestivalId) return;
        try {
            setExpenses(newExpenses);
            const encrypted = encryptData(newExpenses);
            localStorage.setItem(getKey(baseExpenseKey), encrypted);
        } catch (error) {
            console.error("Error saving expenses:", error);
        }
    };

    // Save gallery helper
    const saveGallery = (newGallery) => {
        if (!activeFestivalId) return;
        try {
            setGallery(newGallery);
            const encrypted = encryptData(newGallery);
            localStorage.setItem(getKey(baseGalleryKey), encrypted);
        } catch (error) {
            console.error("Error saving gallery:", error);
        }
    };

    // Save contacts helper
    const saveContacts = (newContacts) => {
        if (!activeFestivalId) return;
        try {
            setContacts(newContacts);
            const encrypted = encryptData(newContacts);
            localStorage.setItem(getKey(baseContactsKey), encrypted);
        } catch (error) {
            console.error("Error saving contacts:", error);
        }
    };

    // Save about helper
    const saveAbout = (newAbout) => {
        if (!activeFestivalId) return;
        try {
            setAboutContent(newAbout);
            const encrypted = encryptData(newAbout);
            localStorage.setItem(getKey(baseAboutKey), encrypted);
        } catch (error) {
            console.error("Error saving about:", error);
        }
    };


    // Auto Backup Logic
    useEffect(() => {
        if (!activeFestivalId) return;

        const backupInterval = setInterval(() => {
            try {
                const version = "1.0";
                const backupDate = new Date().toISOString();
                const obj = {
                    version,
                    backupDate,
                    festivalId: activeFestivalId,
                    donations: data,
                    expenses: expenses,
                    gallery: gallery,
                    contacts: contacts,
                    about: aboutContent
                };

                localStorage.setItem(getKey(baseBackupKey), JSON.stringify(obj));
                console.log("Auto backup completed for", activeFestivalId);
            } catch (error) {
                console.error("Auto backup error:", error);
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(backupInterval);
    }, [data, expenses, gallery, contacts, aboutContent, activeFestivalId]);

    // Manual Backup
    const backupData = () => {
        try {
            const version = "1.0";
            const backupDate = new Date().toISOString();
            const obj = {
                version,
                backupDate,
                festivalId: activeFestivalId,
                donations: data,
                expenses: expenses
            };
            const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `FestivalData_Backup_${activeFestivalId}_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            return true;
        } catch (error) {
            console.error("Backup error:", error);
            return false;
        }
    };

    // Restore Data
    const restoreData = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const obj = JSON.parse(e.target.result);
                    if (!obj.donations || !obj.expenses) {
                        reject("Invalid file format");
                        return;
                    }

                    // Warning: Restoring data overwrites current festival view
                    // We assume user is smart enough or we could enforce festivalId match
                    // For now, allow restoring to ANY festival bucket currently open

                    setData(obj.donations);
                    setExpenses(obj.expenses);
                    if (obj.gallery) setGallery(obj.gallery);
                    if (obj.contacts) setContacts(obj.contacts);
                    if (obj.about) setAboutContent(obj.about);

                    // Persist immediately to CURRENT festival slot
                    if (activeFestivalId) {
                        localStorage.setItem(getKey(baseDonationKey), encryptData(obj.donations));
                        localStorage.setItem(getKey(baseExpenseKey), encryptData(obj.expenses));
                        if (obj.gallery) localStorage.setItem(getKey(baseGalleryKey), encryptData(obj.gallery));
                        if (obj.contacts) localStorage.setItem(getKey(baseContactsKey), encryptData(obj.contacts));
                        if (obj.about) localStorage.setItem(getKey(baseAboutKey), encryptData(obj.about));
                    }

                    resolve(obj);
                } catch (err) {
                    reject("Invalid JSON format");
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsText(file);
        });
    };

    return {
        data,
        expenses,
        gallery,
        contacts,
        aboutContent,
        isLoading: isLoading || festivalLoading,
        saveData,
        saveExpenses,
        saveGallery,
        saveContacts,
        saveAbout,
        backupData,
        restoreData
    };

};
