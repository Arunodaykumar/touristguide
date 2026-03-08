(function () {
    const SYNC_KEYS = ['destinations', 'allUsers', 'bookings', 'deletedDefaultDestinations'];
    const SUPABASE_URL =
        localStorage.getItem('SUPABASE_URL') ||
        'https://ghidvuoipfndpfqyhidz.supabase.co';
    const SUPABASE_ANON_KEY =
        localStorage.getItem('SUPABASE_ANON_KEY') ||
        'sb_publishable_HWgXLBOiwydgTbgEIfFXcA_rWIbr_gE';

    let initialized = false;
    let pushTimer = null;

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
        return {
            id: normalizeId(user.id || user.email || user.name, 'user'),
            name: user.name || '',
            email: user.email || '',
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

    async function replaceTable(table, rows) {
        const deleteRes = await supabaseFetch(`/rest/v1/${table}?id=not.is.null`, { method: 'DELETE' });
        if (!deleteRes.ok) {
            const errText = await deleteRes.text();
            throw new Error(`Delete ${table} failed: ${deleteRes.status} ${errText}`);
        }
        if (!Array.isArray(rows) || rows.length === 0) return;

        const insertRes = await supabaseFetch(`/rest/v1/${table}`, {
            method: 'POST',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify(rows)
        });
        if (!insertRes.ok) {
            const errText = await insertRes.text();
            throw new Error(`Insert ${table} failed: ${insertRes.status} ${errText}`);
        }
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

            syncCurrentUserFromAllUsers();
            window.dispatchEvent(new CustomEvent('remoteStatePulled'));
        } catch (error) {
            console.warn('Supabase pull skipped:', error.message || error);
        }
    }

    async function pushRemoteState() {
        try {
            const payload = getLocalState();
            const destinations = Array.isArray(payload.destinations) ? payload.destinations.map(mapDestinationForDb) : [];
            const users = Array.isArray(payload.allUsers) ? payload.allUsers.map(mapUserForDb) : [];
            const bookings = Array.isArray(payload.bookings) ? payload.bookings.map(mapBookingForDb) : [];

            await replaceTable('destinations', destinations);
            await replaceTable('users', users);
            await replaceTable('bookings', bookings);

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

        pullRemoteState().finally(() => {
            schedulePush(1200);
        });

        window.addEventListener('storage', (event) => {
            if (!event.key || SYNC_KEYS.includes(event.key) || event.key === 'currentUser') {
                schedulePush();
            }
        });

        window.addEventListener('destinationsUpdated', () => schedulePush());
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
