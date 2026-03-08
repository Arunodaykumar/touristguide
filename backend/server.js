const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'tourist-guide-secret-key';
const DATA_FILE = path.join(__dirname, 'data', 'store.json');

// In-memory database for simplicity
let destinations = [
    { id: 1, name: 'Taj Mahal', country: 'India', category: 'cultural', description: 'Iconic white marble mausoleum in Agra', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400', rating: 4.9, price: 800 },
    { id: 2, name: 'Goa Beaches', country: 'India', category: 'beach', description: 'Beautiful beaches and Portuguese heritage', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400', rating: 4.7, price: 600 },
    { id: 3, name: 'Kerala Backwaters', country: 'India', category: 'beach', description: 'Serene backwaters and houseboat cruises', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400', rating: 4.8, price: 700 },
    { id: 4, name: 'Rajasthan Palaces', country: 'India', category: 'cultural', description: 'Magnificent palaces and desert landscapes', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400', rating: 4.8, price: 900 },
    { id: 5, name: 'Himachal Pradesh', country: 'India', category: 'mountain', description: 'Snow-capped mountains and hill stations', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', rating: 4.9, price: 1000 },
    { id: 6, name: 'Golden Temple', country: 'India', category: 'cultural', description: 'Sacred Sikh temple in Amritsar', image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=400', rating: 4.9, price: 500 },
    { id: 7, name: 'Varanasi Ghats', country: 'India', category: 'cultural', description: 'Ancient spiritual city on River Ganges', image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400', rating: 4.6, price: 400 },
    { id: 8, name: 'Mumbai City', country: 'India', category: 'city', description: 'Bollywood capital and financial hub', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400', rating: 4.5, price: 800 },
    { id: 9, name: 'Ladakh', country: 'India', category: 'mountain', description: 'High altitude desert and Buddhist monasteries', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', rating: 4.9, price: 1200 },
    { id: 10, name: 'Andaman Islands', country: 'India', category: 'beach', description: 'Pristine beaches and coral reefs', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400', rating: 4.8, price: 1100 },
    { id: 11, name: 'Khajuraho Temples', country: 'India', category: 'cultural', description: 'Ancient temples with intricate sculptures', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400', rating: 4.7, price: 600 },
    { id: 12, name: 'Darjeeling', country: 'India', category: 'mountain', description: 'Tea gardens and Himalayan views', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400', rating: 4.6, price: 700 },
    { id: 13, name: 'Mysore Palace', country: 'India', category: 'cultural', description: 'Royal palace with Indo-Saracenic architecture', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400', rating: 4.7, price: 500 },
    { id: 14, name: 'Rishikesh', country: 'India', category: 'cultural', description: 'Yoga capital and adventure sports hub', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400', rating: 4.8, price: 600 },
    { id: 15, name: 'Hampi Ruins', country: 'India', category: 'cultural', description: 'Ancient Vijayanagara Empire ruins', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400', rating: 4.6, price: 550 },
    { id: 16, name: 'Ooty Hill Station', country: 'India', category: 'mountain', description: 'Queen of hill stations with tea gardens', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400', rating: 4.5, price: 650 },
    { id: 17, name: 'Ajanta Ellora Caves', country: 'India', category: 'cultural', description: 'Ancient Buddhist and Hindu cave temples', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400', rating: 4.8, price: 600 },
    { id: 18, name: 'Sundarbans', country: 'India', category: 'cultural', description: 'Mangrove forests and Royal Bengal Tigers', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400', rating: 4.7, price: 900 },
    { id: 19, name: 'Coorg Coffee Plantations', country: 'India', category: 'mountain', description: 'Coffee estates and misty hills', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400', rating: 4.6, price: 700 },
    { id: 20, name: 'Pushkar', country: 'India', category: 'cultural', description: 'Holy city with sacred lake and camel fair', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400', rating: 4.5, price: 500 }
];
const DEFAULT_DESTINATIONS = JSON.parse(JSON.stringify(destinations));

let guides = [
    { id: 1, name: 'Ramesh Kumar', location: 'Agra', expertise: 'Taj Mahal Tours', bio: 'Expert guide for Taj Mahal and Agra Fort with 15 years experience', rating: 4.9, price_per_day: 150 },
    { id: 2, name: 'Priya Singh', location: 'Jaipur', expertise: 'Rajasthan Culture', bio: 'Specialist in Rajasthani palaces and cultural heritage', rating: 4.8, price_per_day: 140 },
    { id: 3, name: 'Anu Menon', location: 'Kerala', expertise: 'Backwater Tours', bio: 'Local expert in Kerala backwaters and spice plantations', rating: 4.9, price_per_day: 130 },
    { id: 4, name: 'Vikram Sharma', location: 'Himachal Pradesh', expertise: 'Mountain Trekking', bio: 'Professional mountain guide and adventure specialist', rating: 4.7, price_per_day: 160 }
];

let users = [
    { id: 1, name: 'Admin', email: 'admin@touristguide.com', password: bcrypt.hashSync('admin123', 10), role: 'admin' }
];
let syncedAllUsers = [];

let bookings = [
    { id: 1, user_id: 1, guide_id: 1, destination_id: 1, booking_date: '2024-02-15', status: 'confirmed', user_name: 'Rajesh Gupta', guide_name: 'Ramesh Kumar', destination_name: 'Taj Mahal' }
];

let nextId = { destinations: 21, guides: 5, users: 2, bookings: 2 };
let stateUpdatedAt = new Date().toISOString();

function mergeById(existingList = [], incomingList = []) {
    const map = new Map();
    existingList.forEach((item) => {
        if (item && item.id != null) map.set(String(item.id), item);
    });
    incomingList.forEach((item) => {
        if (!item || item.id == null) return;
        const key = String(item.id);
        const existing = map.get(key) || {};
        map.set(key, { ...existing, ...item });
    });
    return Array.from(map.values());
}

function mergeDestinations(existingList = [], incomingList = []) {
    const map = new Map();
    [...DEFAULT_DESTINATIONS, ...existingList].forEach((item) => {
        if (!item || !item.name) return;
        map.set(String(item.name).toLowerCase(), item);
    });
    incomingList.forEach((item) => {
        if (!item || !item.name) return;
        const key = String(item.name).toLowerCase();
        const existing = map.get(key) || {};
        map.set(key, { ...existing, ...item });
    });
    return Array.from(map.values());
}

function ensureDataDirectory() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function saveStore() {
    ensureDataDirectory();
    stateUpdatedAt = new Date().toISOString();
    const payload = {
        stateUpdatedAt,
        destinations,
        guides,
        users,
        syncedAllUsers,
        bookings,
        nextId
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

function loadStore() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            saveStore();
            return;
        }
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        destinations = Array.isArray(parsed.destinations)
            ? mergeDestinations([], parsed.destinations)
            : mergeDestinations([], destinations);
        guides = Array.isArray(parsed.guides) ? parsed.guides : guides;
        users = Array.isArray(parsed.users) ? parsed.users : users;
        syncedAllUsers = Array.isArray(parsed.syncedAllUsers)
            ? parsed.syncedAllUsers
            : users.filter(u => u.role !== 'admin').map(({ password, ...user }) => user);
        bookings = Array.isArray(parsed.bookings) ? parsed.bookings : bookings;
        nextId = parsed.nextId && typeof parsed.nextId === 'object' ? parsed.nextId : nextId;
        stateUpdatedAt = parsed.stateUpdatedAt || stateUpdatedAt;
    } catch (error) {
        console.error('Failed to load persistent store:', error);
    }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static(path.join(__dirname, '../')));
loadStore();

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Routes

// Auth routes
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Destinations routes
app.get('/api/destinations', (req, res) => {
    const { search, category, country } = req.query;
    let filtered = destinations;

    if (search) {
        filtered = filtered.filter(d => 
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.description.toLowerCase().includes(search.toLowerCase())
        );
    }
    if (category) {
        filtered = filtered.filter(d => d.category === category);
    }
    if (country) {
        filtered = filtered.filter(d => d.country === country);
    }

    res.json(filtered);
});

app.get('/api/destinations/:id', (req, res) => {
    const destination = destinations.find(d => d.id === parseInt(req.params.id));
    if (!destination) {
        return res.status(404).json({ error: 'Destination not found' });
    }
    res.json(destination);
});

app.post('/api/destinations', authenticateToken, (req, res) => {
    const { name, country, category, description, image, price } = req.body;
    const newDestination = {
        id: nextId.destinations++,
        name, country, category, description, image: image || '',
        price: price || 0, rating: 0
    };
    destinations.push(newDestination);
    saveStore();
    res.json({ id: newDestination.id, message: 'Destination created successfully' });
});

// Guides routes
app.get('/api/guides', (req, res) => {
    const { location, expertise } = req.query;
    let filtered = guides;

    if (location) {
        filtered = filtered.filter(g => g.location.toLowerCase().includes(location.toLowerCase()));
    }
    if (expertise) {
        filtered = filtered.filter(g => g.expertise.toLowerCase().includes(expertise.toLowerCase()));
    }

    res.json(filtered);
});

app.post('/api/guides', authenticateToken, (req, res) => {
    const { name, location, expertise, bio, price_per_day } = req.body;
    const newGuide = {
        id: nextId.guides++,
        name, location, expertise, bio: bio || '',
        price_per_day: price_per_day || 0, rating: 0
    };
    guides.push(newGuide);
    saveStore();
    res.json({ id: newGuide.id, message: 'Guide created successfully' });
});

// Bookings routes
app.get('/api/bookings', authenticateToken, (req, res) => {
    let filtered = bookings;
    
    if (req.user.role !== 'admin') {
        filtered = bookings.filter(b => b.user_id === req.user.id);
    }
    
    res.json(filtered);
});

app.post('/api/bookings', authenticateToken, (req, res) => {
    const { guide_id, destination_id, booking_date } = req.body;
    const newBooking = {
        id: nextId.bookings++,
        user_id: req.user.id,
        guide_id, destination_id, booking_date,
        status: 'pending'
    };
    bookings.push(newBooking);
    saveStore();
    res.json({ id: newBooking.id, message: 'Booking created successfully' });
});

// State sync routes for localStorage-based frontend
app.get('/api/state', (req, res) => {
    res.json({
        stateUpdatedAt,
        destinations,
        allUsers: syncedAllUsers,
        bookings
    });
});

app.post('/api/state', (req, res) => {
    const payload = req.body || {};

    if (Array.isArray(payload.destinations)) {
        destinations = mergeDestinations(destinations, payload.destinations);
        const maxDestId = destinations.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
        nextId.destinations = Math.max(nextId.destinations || 1, maxDestId + 1);
    }

    if (Array.isArray(payload.allUsers)) {
        syncedAllUsers = mergeById(syncedAllUsers, payload.allUsers);
        const existingAdmin = users.filter(u => u.role === 'admin');
        users = [
            ...existingAdmin,
            ...syncedAllUsers.map(user => {
                const existing = users.find(u => String(u.id) === String(user.id));
                if (existing && existing.password) {
                    return { ...existing, ...user };
                }
                return user;
            })
        ];
        const maxUserId = users.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
        nextId.users = Math.max(nextId.users || 1, maxUserId + 1);
    }

    if (Array.isArray(payload.bookings)) {
        bookings = mergeById(bookings, payload.bookings);
        const maxBookingId = bookings.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
        nextId.bookings = Math.max(nextId.bookings || 1, maxBookingId + 1);
    }

    saveStore();
    res.json({ success: true, stateUpdatedAt });
});

// Stats route for admin
app.get('/api/stats', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const stats = {
        destinations: destinations.length,
        users: users.filter(u => u.role === 'user').length,
        bookings: bookings.length,
        avgRating: destinations.reduce((sum, d) => sum + d.rating, 0) / destinations.length || 0
    };
    
    res.json(stats);
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
