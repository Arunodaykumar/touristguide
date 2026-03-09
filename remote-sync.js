(function () {
    const SYNC_KEYS = ['destinations', 'allUsers', 'bookings', 'deletedDefaultDestinations'];
    const SETTINGS_KEYS = ['siteLogo', 'siteName', 'heroTitle', 'heroSubtitle', 'heroPrimaryBtnText', 'heroSecondaryBtnText', 'heroBackgroundImage', 'contactEmail', 'supportEmail', 'contactPhone', 'contactAddress', 'currency', 'taxRate', 'lastUpdated', 'settingsVersion', 'deletedUserIds', 'deletedDestinationNames', 'deletedBookingIds'];
    const SUPABASE_URL =
        localStorage.getItem('SUPABASE_URL') ||
        'https://ghidvuoipfndpfqyhidz.supabase.co';
    const SUPABASE_ANON_KEY =
        localStorage.getItem('SUPABASE_ANON_KEY') ||
        'sb_publishable_HWgXLBOiwydgTbgEIfFXcA_rWIbr_gE';

    let initialized = false;
    let pushTimer = null;
    let suppressPush = false;

    function safeJsonParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function getLocalState() {
        const payload = {};
        SYNC_KEYS.forEach((key) => {
            const raw = localStorage.getItem(key);
            if (raw == null) return;
            payload[key] = safeJsonParse(raw, []);
        });
        return payload;
    }

    function getLocalSettingsRows() {
        return SETTINGS_KEYS
            .map((key) => ({ key, value_text: localStorage.getItem(key) }))
            .filter((row) => row.value_text != null);
    }

    function getJsonArray(key) {
        const parsed = safeJsonParse(localStorage.getItem(key) || '[]', []);
        return Array.isArray(parsed) ? parsed : [];
    }

    function getDeletedIdSet(key) {
        return new Set(getJsonArray(key).map((v) => String(v)));
    }

    function getDeletedNameSet(key) {
        return new Set(getJsonArray(key).map((v) => String(v || '').toLowerCase()));
    }

    function supabaseFetch(path, options = {}) {
        return fetch(`${SUPABASE_URL}${path}`, {
            ...options,
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
    }

    function normalizeId(value, fallbackPrefix = 'id') {
        if (value === undefined || value === null || value === '') {
            return `${fallbackPrefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        }
        return String(value);
    }

    function mapDestinationForDb(dest) {
        return {
            id: normalizeId(dest.id || dest.name, 'dest'),
            name: dest.name || '',
            country: dest.country || '',
            category: dest.category || '',
            description: dest.description || '',
            image_url: dest.imageUrl || dest.image || '',
            rating: Number(dest.rating || 0) || 0,
            price: Number(dest.price || 0) || 0,
            best_time: dest.bestTime || ''
        };
    }

    function mapUserForDb(user) {
        const emailValue = String(user.email || '').trim();
        return {
            id: normalizeId(user.id || user.email || user.name, 'user'),
            name: user.name || '',
            email: emailValue || null,
            role: user.role || 'tourist',
            phone: user.phone || '',
            password: user.password || '',
            photo: user.photo || '',
            destination: user.destination || '',
            expertise: user.expertise || '',
            rating: Number(user.rating || 4.5) || 4.5,
            experience: user.experience || '',
            rate: Number(user.rate || 100) || 100,
            bookings: Array.isArray(user.bookings) ? user.bookings : [],
            messages: Array.isArray(user.messages) ? user.messages : [],
            sent_messages: Array.isArray(user.sentMessages) ? user.sentMessages : [],
            notifications: Array.isArray(user.notifications) ? user.notifications : []
        };
    }

    function mapBookingForDb(booking) {
        return {
            id: normalizeId(booking.id, 'booking'),
            type: booking.type || '',
            destination: booking.destination || '',
            guide: booking.guide || '',
            guide_id: booking.guideId ? String(booking.guideId) : '',
            customer_name: booking.customerName || '',
            customer_id: booking.customerId ? String(booking.customerId) : '',
            date: booking.date || '',
            people: Number(booking.people || 0) || 0,
            hours: Number(booking.hours || 0) || 0,
            amount: Number(booking.amount || 0) || 0,
            status: booking.status || 'confirmed'
        };
    }

    function mapDestinationFromDb(row) {
        return {
            id: row.id,
            name: row.name,
            country: row.country,
            category: row.category,
            description: row.description,
            imageUrl: row.image_url || '',
            image: row.image_url || '',
            rating: row.rating,
            price: row.price,
            bestTime: row.best_time
        };
    }

    function mapUserFromDb(row) {
        return {
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            phone: row.phone,
            password: row.password,
            photo: row.photo,
            destination: row.destination,
            expertise: row.expertise,
            rating: row.rating,
            experience: row.experience,
            rate: row.rate,
            bookings: Array.isArray(row.bookings) ? row.bookings : [],
            messages: Array.isArray(row.messages) ? row.messages : [],
            sentMessages: Array.isArray(row.sent_messages) ? row.sent_messages : [],
            notifications: Array.isArray(row.notifications) ? row.notifications : []
        };
    }

    function mapBookingFromDb(row) {
        return {
            id: row.id,
            type: row.type,
            destination: row.destination,
            guide: row.guide,
            guideId: row.guide_id,
            customerName: row.customer_name,
            customerId: row.customer_id,
            date: row.date,
            people: row.people,
            hours: row.hours,
            amount: row.amount,
            status: row.status,
            bookingDate: row.booking_date
        };
    }

    async function postUpsertRows(table, rows) {
        const insertRes = await supabaseFetch(`/rest/v1/${table}?on_conflict=id`, {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify(rows)
        });
        if (!insertRes.ok) {
            const errText = await insertRes.text();
            throw new Error(`Upsert ${table} failed: ${insertRes.status} ${errText}`);
        }
    }

    async function upsertTable(table, rows) {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const maxBatchChars = 180000;
        let batch = [];
        let currentSize = 2;

        for (const row of rows) {
            const rowText = JSON.stringify(row);
            const rowSize = rowText.length + 1;

            if (rowSize > maxBatchChars) {
                await postUpsertRows(table, [row]);
                continue;
            }

            if (currentSize + rowSize > maxBatchChars && batch.length > 0) {
                await postUpsertRows(table, batch);
                batch = [];
                currentSize = 2;
            }

            batch.push(row);
            currentSize += rowSize;
        }

        if (batch.length > 0) {
            await postUpsertRows(table, batch);
        }
    }

    async function deleteRowById(table, idValue) {
        if (idValue == null || idValue === '') return;
        const res = await supabaseFetch(`/rest/v1/${table}?id=eq.${encodeURIComponent(String(idValue))}`, {
            method: 'DELETE',
            headers: { Prefer: 'return=minimal' }
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Delete ${table}(${idValue}) failed: ${res.status} ${errText}`);
        }
    }

    async function reconcileDeletes(table, localRows) {
        if (!Array.isArray(localRows)) return;
        const idsRes = await supabaseFetch(`/rest/v1/${table}?select=id`);
        if (!idsRes.ok) {
            const errText = await idsRes.text();
            throw new Error(`Fetch ${table} ids failed: ${idsRes.status} ${errText}`);
        }

        const remoteRows = await idsRes.json();
        const localIds = new Set(localRows.map((row) => String(row.id)));
        const remoteIds = (remoteRows || []).map((row) => String(row.id));
        const idsToDelete = remoteIds.filter((id) => !localIds.has(id));

        for (const id of idsToDelete) {
            await deleteRowById(table, id);
        }
    }

    async function upsertSettings(rows) {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const maxBatchChars = 180000;
        let batch = [];
        let currentSize = 2;

        for (const row of rows) {
            const rowText = JSON.stringify(row);
            const rowSize = rowText.length + 1;

            if (rowSize > maxBatchChars) {
                const singleRes = await supabaseFetch('/rest/v1/app_settings?on_conflict=key', {
                    method: 'POST',
                    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
                    body: JSON.stringify([row])
                });
                if (!singleRes.ok) {
                    const errText = await singleRes.text();
                    throw new Error(`Upsert app_settings failed: ${singleRes.status} ${errText}`);
                }
                continue;
            }

            if (currentSize + rowSize > maxBatchChars && batch.length > 0) {
                const batchRes = await supabaseFetch('/rest/v1/app_settings?on_conflict=key', {
                    method: 'POST',
                    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
                    body: JSON.stringify(batch)
                });
                if (!batchRes.ok) {
                    const errText = await batchRes.text();
                    throw new Error(`Upsert app_settings failed: ${batchRes.status} ${errText}`);
                }
                batch = [];
                currentSize = 2;
            }

            batch.push(row);
            currentSize += rowSize;
        }

        if (batch.length > 0) {
            const insertRes = await supabaseFetch('/rest/v1/app_settings?on_conflict=key', {
                method: 'POST',
                headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
                body: JSON.stringify(batch)
            });
            if (!insertRes.ok) {
                const errText = await insertRes.text();
                throw new Error(`Upsert app_settings failed: ${insertRes.status} ${errText}`);
            }
        }
    }

    function pruneLargeStrings(value, maxDataUrlLength = 200000) {
        if (value == null) return value;
        if (typeof value === 'string') {
            if (value.startsWith('data:') && value.length > maxDataUrlLength) return '';
            return value;
        }
        if (Array.isArray(value)) return value.map((item) => pruneLargeStrings(item, maxDataUrlLength));
        if (typeof value === 'object') {
            const out = {};
            Object.keys(value).forEach((k) => {
                out[k] = pruneLargeStrings(value[k], maxDataUrlLength);
            });
            return out;
        }
        return value;
    }

    function syncCurrentUserFromAllUsers() {
        const currentUser = safeJsonParse(localStorage.getItem('currentUser') || 'null', null);
        if (!currentUser || !currentUser.id) return;
        const allUsers = safeJsonParse(localStorage.getItem('allUsers') || '[]', []);
        const freshUser = allUsers.find((user) => String(user.id) === String(currentUser.id));
        if (freshUser) {
            localStorage.setItem('currentUser', JSON.stringify(freshUser));
        }
    }

    function applyDeleteTombstonesToLocalState() {
        const deletedUserIds = getDeletedIdSet('deletedUserIds');
        const deletedDestinationNames = getDeletedNameSet('deletedDestinationNames');
        const deletedBookingIds = getDeletedIdSet('deletedBookingIds');

        const allUsers = safeJsonParse(localStorage.getItem('allUsers') || '[]', []);
        const nextUsers = Array.isArray(allUsers)
            ? allUsers.filter((u) => !deletedUserIds.has(String(u && u.id)))
            : [];
        if (JSON.stringify(allUsers) !== JSON.stringify(nextUsers)) {
            localStorage.setItem('allUsers', JSON.stringify(nextUsers));
        }

        const destinations = safeJsonParse(localStorage.getItem('destinations') || '[]', []);
        const nextDestinations = Array.isArray(destinations)
            ? destinations.filter((d) => !deletedDestinationNames.has(String((d && d.name) || '').toLowerCase()))
            : [];
        if (JSON.stringify(destinations) !== JSON.stringify(nextDestinations)) {
            localStorage.setItem('destinations', JSON.stringify(nextDestinations));
        }

        const bookings = safeJsonParse(localStorage.getItem('bookings') || '[]', []);
        const nextBookings = Array.isArray(bookings)
            ? bookings.filter((b) => !deletedBookingIds.has(String(b && b.id)))
            : [];
        if (JSON.stringify(bookings) !== JSON.stringify(nextBookings)) {
            localStorage.setItem('bookings', JSON.stringify(nextBookings));
        }
    }

    async function pullRemoteState() {
        try {
            suppressPush = true;
            const [destRes, usersRes, bookingsRes] = await Promise.all([
                supabaseFetch('/rest/v1/destinations?select=*'),
                supabaseFetch('/rest/v1/users?select=*'),
                supabaseFetch('/rest/v1/bookings?select=*')
            ]);

            if (!destRes.ok || !usersRes.ok || !bookingsRes.ok) {
                throw new Error('Supabase fetch failed (check RLS policies)');
            }

            const [destRows, userRows, bookingRows] = await Promise.all([
                destRes.json(),
                usersRes.json(),
                bookingsRes.json()
            ]);

            localStorage.setItem('destinations', JSON.stringify((destRows || []).map(mapDestinationFromDb)));
            localStorage.setItem('allUsers', JSON.stringify((userRows || []).map(mapUserFromDb)));
            localStorage.setItem('bookings', JSON.stringify((bookingRows || []).map(mapBookingFromDb)));

            try {
                const settingsRes = await supabaseFetch('/rest/v1/app_settings?select=key,value_text');
                if (settingsRes.ok) {
                    const settingsRows = await settingsRes.json();
                    const settingsMap = {};
                    (settingsRows || []).forEach((row) => {
                        if (!row || !row.key) return;
                        settingsMap[String(row.key)] = row.value_text == null ? '' : String(row.value_text);
                    });

                    const localVersion = Number(localStorage.getItem('settingsVersion') || '0') || 0;
                    const remoteVersion = Number(settingsMap.settingsVersion || '0') || 0;
                    const shouldApplyRemoteSettings = remoteVersion >= localVersion || localVersion === 0;

                    if (shouldApplyRemoteSettings) {
                        Object.keys(settingsMap).forEach((key) => {
                            localStorage.setItem(key, settingsMap[key]);
                        });
                    }
                }
            } catch (settingsErr) {
                console.warn('Supabase settings pull skipped:', settingsErr.message || settingsErr);
            }

            applyDeleteTombstonesToLocalState();
            syncCurrentUserFromAllUsers();
            window.dispatchEvent(new CustomEvent('remoteStatePulled'));
        } catch (error) {
            console.warn('Supabase pull skipped:', error.message || error);
        } finally {
            suppressPush = false;
        }
    }

    async function pushRemoteState() {
        try {
            const payload = getLocalState();
            const deletedUserIds = getDeletedIdSet('deletedUserIds');
            const deletedDestinationNames = getDeletedNameSet('deletedDestinationNames');
            const deletedBookingIds = getDeletedIdSet('deletedBookingIds');

            const destinations = Array.isArray(payload.destinations)
                ? payload.destinations
                    .filter((d) => !deletedDestinationNames.has(String((d && d.name) || '').toLowerCase()))
                    .map((d) => pruneLargeStrings(mapDestinationForDb(d), 500000))
                : [];
            const users = Array.isArray(payload.allUsers)
                ? payload.allUsers
                    .filter((u) => !deletedUserIds.has(String(u && u.id)))
                    .map((u) => pruneLargeStrings(mapUserForDb(u)))
                : [];
            const bookings = Array.isArray(payload.bookings)
                ? payload.bookings
                    .filter((b) => !deletedBookingIds.has(String(b && b.id)))
                    .map((b) => pruneLargeStrings(mapBookingForDb(b)))
                : [];
            const settingsRows = getLocalSettingsRows().map((row) => ({
                key: row.key,
                value_text: (row.key === 'siteLogo' || row.key === 'heroBackgroundImage')
                    ? pruneLargeStrings(row.value_text, 600000)
                    : pruneLargeStrings(row.value_text)
            }));

            let syncedAny = false;
            try {
                await upsertTable('destinations', destinations);
                await reconcileDeletes('destinations', destinations);
                syncedAny = true;
            } catch (err) {
                console.warn('Supabase destinations upsert failed:', err.message || err);
            }
            try {
                await upsertTable('users', users);
                await reconcileDeletes('users', users);
                syncedAny = true;
            } catch (err) {
                console.warn('Supabase users upsert failed:', err.message || err);
            }
            try {
                await upsertTable('bookings', bookings);
                await reconcileDeletes('bookings', bookings);
                syncedAny = true;
            } catch (err) {
                console.warn('Supabase bookings upsert failed:', err.message || err);
            }
            try {
                await upsertSettings(settingsRows);
                syncedAny = true;
            } catch (err) {
                console.warn('Supabase settings upsert failed:', err.message || err);
            }

            if (!syncedAny) throw new Error('No table synced');

            window.dispatchEvent(new CustomEvent('remoteStatePushed'));
        } catch (error) {
            console.warn('Supabase push skipped:', error.message || error);
        }
    }

    function schedulePush(delay = 700) {
        if (pushTimer) clearTimeout(pushTimer);
        pushTimer = setTimeout(() => {
            pushRemoteState();
        }, delay);
    }

    function init() {
        if (initialized) return;
        initialized = true;

        const originalSetItem = localStorage.setItem.bind(localStorage);
        localStorage.setItem = function patchedSetItem(key, value) {
            originalSetItem(key, value);
            if (suppressPush) return;
            if (!key || SYNC_KEYS.includes(key) || SETTINGS_KEYS.includes(key) || key === 'currentUser') {
                schedulePush(250);
            }
        };

        pullRemoteState().finally(() => {
            schedulePush(1200);
        });

        window.addEventListener('storage', (event) => {
            if (!event.key || SYNC_KEYS.includes(event.key) || SETTINGS_KEYS.includes(event.key) || event.key === 'currentUser') {
                schedulePush();
            }
        });

        window.addEventListener('destinationsUpdated', () => schedulePush());
        window.addEventListener('settingsUpdated', () => schedulePush());
        window.addEventListener('focus', () => pullRemoteState());
        setInterval(() => pullRemoteState(), 20000);
    }

    window.remoteStateSync = {
        init,
        pullRemoteState,
        pushRemoteState
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
