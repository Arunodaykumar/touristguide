# Tourist Guide Website

A comprehensive tourist guide website with HTML frontend, CSS styling, and Java Spring Boot backend, designed for AWS deployment.

## Project Structure
```
tourist-guide-website/
├── index.html          # Main HTML page
├── styles.css          # CSS styling
├── script.js           # Frontend JavaScript
├── backend/            # Java Spring Boot backend
│   ├── src/main/java/com/touristguide/
│   │   ├── TouristGuideApplication.java
│   │   ├── model/Destination.java
│   │   ├── controller/DestinationController.java
│   │   └── service/DestinationService.java
│   └── pom.xml
├── AWS_DEPLOYMENT.md   # AWS deployment guide
└── README.md
```

## Features
- Responsive design for all devices
- Tourist destination catalog with ratings
- Travel guides and tips
- RESTful API for destination data
- AWS-ready deployment configuration

## Local Development

### Frontend
1. Open `index.html` in a web browser
2. For development server: `python -m http.server 8000`

### Backend
1. Navigate to backend directory: `cd backend`
2. Run with Maven: `./mvnw spring-boot:run`
3. API available at: `http://localhost:8080/api`

## API Endpoints
- `GET /api/destinations` - Get all destinations
- `GET /api/destinations/{id}` - Get destination by ID
- `GET /api/destinations/country/{country}` - Get destinations by country
- `GET /api/destinations/category/{category}` - Get destinations by category

## AWS Deployment
See `AWS_DEPLOYMENT.md` for detailed deployment instructions.

## Technologies Used
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Java 17, Spring Boot 3.1, Maven
- **Deployment:** AWS S3, CloudFront, Elastic Beanstalk