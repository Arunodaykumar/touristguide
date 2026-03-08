(function () {
    const SYNC_KEYS = ['destinations', 'allUsers', 'bookings', 'deletedDefaultDestinations'];
    const API_BASE_CANDIDATES =
        window.location.protocol === 'file:'
            ? ['http://localhost:3000/api', 'http://localhost:3001/api']
            : [`${window.location.origin}/api`, '/api'];

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

    function buildSyncPayload(slim = false) {
        const payload = getLocalState();
        if (!slim) return payload;

        const stripLargeDataUrl = (value) => {
            if (typeof value !== 'string') return value;
            if (!value.startsWith('data:')) return value;
            return value.length > 200000 ? '' : value;
        };

        if (Array.isArray(payload.destinations)) {
            payload.destinations = payload.destinations.map((dest) => ({
                ...dest,
                imageUrl: stripLargeDataUrl(dest.imageUrl),
                image: stripLargeDataUrl(dest.image)
            }));
        }

        if (Array.isArray(payload.allUsers)) {
            payload.allUsers = payload.allUsers.map((user) => ({
                ...user,
                photo: stripLargeDataUrl(user.photo)
            }));
        }

        return payload;
    }

    function shouldKeepLocalOnPull(key, remoteValue) {
        const localRaw = localStorage.getItem(key);
        if (localRaw == null) return false;
        const localValue = safeJsonParse(localRaw, []);
        const localCount = Array.isArray(localValue) ? localValue.length : 0;
        const remoteCount = Array.isArray(remoteValue) ? remoteValue.length : 0;
        return localCount > 0 && remoteCount === 0;
    }

    function syncCurrentUserFromAllUsers() {
        const currentUser = safeJsonParse(localStorage.getItem('currentUser') || 'null', null);
        if (!currentUser || !currentUser.id) return;
        const allUsers = safeJsonParse(localStorage.getItem('allUsers') || '[]', []);
        const freshUser = allUsers.find(user => String(user.id) === String(currentUser.id));
        if (freshUser) {
            localStorage.setItem('currentUser', JSON.stringify(freshUser));
        }
    }

    async function requestState(path, options) {
        let lastError = null;
        for (const base of API_BASE_CANDIDATES) {
            try {
                const response = await fetch(`${base}${path}`, options);
                if (response.ok) return response;
                const httpError = new Error(`HTTP ${response.status}`);
                httpError.status = response.status;
                lastError = httpError;
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError || new Error('State API not reachable');
    }

    async function pullRemoteState() {
        try {
            const response = await requestState('/state', { method: 'GET' });
            const remote = await response.json();

            SYNC_KEYS.forEach((key) => {
                if (remote[key] === undefined) return;
                if (shouldKeepLocalOnPull(key, remote[key])) {
                    schedulePush(300);
                    return;
                }
                localStorage.setItem(key, JSON.stringify(remote[key]));
            });

            syncCurrentUserFromAllUsers();
            window.dispatchEvent(new CustomEvent('remoteStatePulled'));
        } catch (error) {
            console.warn('Remote pull skipped:', error.message || error);
        }
    }

    async function pushRemoteState() {
        try {
            const payload = buildSyncPayload(false);
            await requestState('/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            window.dispatchEvent(new CustomEvent('remoteStatePushed'));
        } catch (error) {
            if (error && Number(error.status) === 413) {
                try {
                    const slimPayload = buildSyncPayload(true);
                    await requestState('/state', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(slimPayload)
                    });
                    window.dispatchEvent(new CustomEvent('remoteStatePushed'));
                    return;
                } catch (retryError) {
                    console.warn('Remote push retry skipped:', retryError.message || retryError);
                }
            }
            console.warn('Remote push skipped:', error.message || error);
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
            // Ensure first-time local data gets uploaded as well.
            schedulePush(1200);
        });

        window.addEventListener('storage', (event) => {
            if (!event.key || SYNC_KEYS.includes(event.key) || event.key === 'currentUser') {
                schedulePush();
            }
        });

        window.addEventListener('destinationsUpdated', () => schedulePush());
        window.addEventListener('focus', () => pullRemoteState());
        setInterval(() => pullRemoteState(), 15000);
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
