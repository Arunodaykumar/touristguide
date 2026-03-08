(function () {
    const SYNC_KEYS = ['destinations', 'allUsers', 'bookings', 'deletedDefaultDestinations'];
    const SETTINGS_KEYS = ['siteLogo', 'siteName', 'contactEmail', 'supportEmail', 'contactPhone', 'contactAddress', 'currency', 'taxRate', 'lastUpdated'];
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

    async function upsertTable(table, rows) {
        if (!Array.isArray(rows) || rows.length === 0) return;
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

    async function upsertSettings(rows) {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const insertRes = await supabaseFetch('/rest/v1/app_settings?on_conflict=key', {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify(rows)
        });
        if (!insertRes.ok) {
            const errText = await insertRes.text();
            throw new Error(`Upsert app_settings failed: ${insertRes.status} ${errText}`);
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
                    (settingsRows || []).forEach((row) => {
                        if (!row || !row.key) return;
                        localStorage.setItem(String(row.key), row.value_text == null ? '' : String(row.value_text));
                    });
                }
            } catch (settingsErr) {
                console.warn('Supabase settings pull skipped:', settingsErr.message || settingsErr);
            }

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
            const destinations = Array.isArray(payload.destinations)
                ? payload.destinations.map((d) => pruneLargeStrings(mapDestinationForDb(d), 500000))
                : [];
            const users = Array.isArray(payload.allUsers)
                ? payload.allUsers.map((u) => pruneLargeStrings(mapUserForDb(u)))
                : [];
            const bookings = Array.isArray(payload.bookings)
                ? payload.bookings.map((b) => pruneLargeStrings(mapBookingForDb(b)))
                : [];
            const settingsRows = getLocalSettingsRows().map((row) => ({
                key: row.key,
                value_text: row.key === 'siteLogo'
                    ? pruneLargeStrings(row.value_text, 600000)
                    : pruneLargeStrings(row.value_text)
            }));

            let syncedAny = false;
            try {
                await upsertTable('destinations', destinations);
                syncedAny = true;
            } catch (err) {
                console.warn('Supabase destinations upsert failed:', err.message || err);
            }
            try {
                await upsertTable('users', users);
                syncedAny = true;
            } catch (err) {
                console.warn('Supabase users upsert failed:', err.message || err);
            }
            try {
                await upsertTable('bookings', bookings);
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
