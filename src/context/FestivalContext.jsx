import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FestivalContext = createContext();

export const useFestival = () => useContext(FestivalContext);

const FESTIVAL_META_KEY = 'festival_meta';
const DONATION_KEY = 'donationData';
const EXPENSE_KEY = 'expenseData';
const GALLERY_KEY = 'galleryData';
const CONTACTS_KEY = 'contactsData';
const ABOUT_KEY = 'aboutData';

export const FestivalProvider = ({ children }) => {
    const { user } = useAuth();
    const [allFestivals, setAllFestivals] = useState([]);
    const [activeFestivalId, setActiveFestivalId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Every user (Admin or Member) only sees festivals within their specific Club
    const festivals = user?.clubName
        ? allFestivals.filter(f => f.clubName === user.clubName)
        : [];


    useEffect(() => {
        initializeFestivals();
    }, []);

    // Ensure activeFestivalId belongs to the current user's festivals
    useEffect(() => {
        if (!loading && user && activeFestivalId) {
            const isValid = festivals.some(f => f.id === activeFestivalId);
            if (!isValid) {
                setActiveFestivalId(null);
            }
        }
    }, [user, activeFestivalId, festivals, loading]);


    const initializeFestivals = () => {
        try {
            const meta = localStorage.getItem(FESTIVAL_META_KEY);
            if (meta) {
                const parsed = JSON.parse(meta);
                setAllFestivals(parsed.festivals);
                setActiveFestivalId(parsed.activeFestivalId);
            } else {
                const hasLegacyData = localStorage.getItem(DONATION_KEY) !== null;
                const defaultFestival = {
                    id: 'default_fes_1',
                    name: 'My Festival',
                    clubName: 'My Festival',
                    address: 'My Festival',
                    createdDate: new Date().toISOString()
                };

                if (hasLegacyData) {
                    migrateKey(DONATION_KEY, defaultFestival.id);
                    migrateKey(EXPENSE_KEY, defaultFestival.id);
                    migrateKey(GALLERY_KEY, defaultFestival.id);
                    migrateKey(CONTACTS_KEY, defaultFestival.id);
                    migrateKey(ABOUT_KEY, defaultFestival.id);
                }

                const initialMeta = {
                    festivals: [defaultFestival],
                    activeFestivalId: defaultFestival.id
                };

                localStorage.setItem(FESTIVAL_META_KEY, JSON.stringify(initialMeta));
                setAllFestivals(initialMeta.festivals);
                setActiveFestivalId(initialMeta.activeFestivalId);
            }
        } catch (error) {
            console.error("Error initializing festivals:", error);
        } finally {
            setLoading(false);
        }
    };

    const migrateKey = (baseKey, festivalId) => {
        const data = localStorage.getItem(baseKey);
        if (data) {
            localStorage.setItem(`${baseKey}_${festivalId}`, data);
        }
    };

    const createFestival = (name, clubName, address) => {
        const newFestival = {
            id: `fes_${Date.now()}`,
            name,
            clubName: clubName || name,
            address: address || clubName || name,
            createdDate: new Date().toISOString()
        };

        const updatedFestivals = [...allFestivals, newFestival];
        setAllFestivals(updatedFestivals);
        setActiveFestivalId(newFestival.id);
        saveMeta(updatedFestivals, newFestival.id);
    };

    const switchFestival = (festivalId) => {
        setActiveFestivalId(festivalId);
        saveMeta(allFestivals, festivalId);
    };

    const deleteFestival = (festivalId) => {
        const updatedFestivals = allFestivals.filter(f => f.id !== festivalId);
        const filtered = updatedFestivals.filter(f => user?.role === 'admin' ? f.clubName === user.clubName : true);

        let newActiveId = activeFestivalId;
        if (activeFestivalId === festivalId) {
            newActiveId = filtered.length > 0 ? filtered[0].id : null;
        }

        setAllFestivals(updatedFestivals);
        setActiveFestivalId(newActiveId);
        saveMeta(updatedFestivals, newActiveId);
        cleanupFestivalData(festivalId);
    };

    const cleanupFestivalData = (festivalId) => {
        localStorage.removeItem(`${DONATION_KEY}_${festivalId}`);
        localStorage.removeItem(`${EXPENSE_KEY}_${festivalId}`);
        localStorage.removeItem(`${GALLERY_KEY}_${festivalId}`);
        localStorage.removeItem(`${CONTACTS_KEY}_${festivalId}`);
        localStorage.removeItem(`${ABOUT_KEY}_${festivalId}`);
    };

    const saveMeta = (currFestivals, currActiveId) => {
        localStorage.setItem(FESTIVAL_META_KEY, JSON.stringify({
            festivals: currFestivals,
            activeFestivalId: currActiveId
        }));
    };

    const updateFestival = (festivalId, newName, newClubName, newAddress) => {
        if (!newClubName || newClubName.trim() === '') {
            deleteFestival(festivalId);
            return;
        }

        const updatedFestivals = allFestivals.map(f =>
            f.id === festivalId ? { ...f, name: newName, clubName: newClubName, address: newAddress || newClubName } : f
        );
        setAllFestivals(updatedFestivals);
        saveMeta(updatedFestivals, activeFestivalId);
    };

    return (
        <FestivalContext.Provider value={{
            festivals,
            activeFestivalId,
            createFestival,
            switchFestival,
            deleteFestival,
            updateFestival,
            loading
        }}>
            {children}
        </FestivalContext.Provider>
    );
};

