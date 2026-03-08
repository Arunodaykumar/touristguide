# Backend Setup Instructions

## Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login

### Destinations
- `GET /api/destinations` - Get all destinations
- `GET /api/destinations/:id` - Get destination by ID
- `POST /api/destinations` - Create new destination (requires auth)

### Guides
- `GET /api/guides` - Get all guides
- `POST /api/guides` - Create new guide (requires auth)

### Bookings
- `GET /api/bookings` - Get bookings (requires auth)
- `POST /api/bookings` - Create booking (requires auth)

### Admin
- `GET /api/stats` - Get dashboard statistics (admin only)

## Default Admin Credentials
- Email: `admin@touristguide.com`
- Password: `admin123`

## Database
- Uses SQLite database (database.db)
- Automatically creates tables and sample data on first run
- No additional database setup required

## Production Deployment
For AWS EC2 deployment:
1. Install Node.js on EC2 instance
2. Clone repository
3. Run `npm install` in backend directory
4. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name tourist-guide-api
```

## Environment Variables
Set these for production:
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - JWT secret key for authentication