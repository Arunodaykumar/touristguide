# AWS Elastic Beanstalk Deployment Guide

## Frontend Deployment (S3 + CloudFront)

1. **Create S3 Bucket for Static Website Hosting:**
   ```bash
   aws s3 mb s3://your-tourist-guide-website
   aws s3 website s3://your-tourist-guide-website --index-document index.html
   ```

2. **Upload Frontend Files:**
   ```bash
   aws s3 sync . s3://your-tourist-guide-website --exclude "backend/*" --exclude "*.md"
   ```

3. **Create CloudFront Distribution:**
   - Origin: S3 bucket website endpoint
   - Default root object: index.html
   - Enable compression

## Backend Deployment (Elastic Beanstalk)

1. **Install EB CLI:**
   ```bash
   pip install awsebcli
   ```

2. **Initialize and Deploy:**
   ```bash
   cd backend
   eb init tourist-guide-api --platform java-17
   eb create tourist-guide-env
   eb deploy
   ```

3. **Environment Variables:**
   - Set CORS_ORIGINS to your CloudFront domain
   - Configure any database connections if needed

## Alternative: Docker Deployment

### Frontend (Nginx)
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

### Backend (Java)
```dockerfile
FROM openjdk:17-jdk-slim
COPY target/tourist-guide-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

## Cost Optimization
- Use S3 Standard-IA for infrequently accessed assets
- Enable CloudFront caching
- Use Elastic Beanstalk single instance for development
- Consider AWS Lambda + API Gateway for serverless backend