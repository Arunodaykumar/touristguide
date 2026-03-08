#!/bin/bash

# EC2 Startup Script for Tourist Guide Website
# Save this as startup.sh and run on EC2 instance

echo "Starting Tourist Guide Website deployment..."

# Update system
sudo yum update -y

# Install Java 17
sudo yum install java-17-amazon-corretto-devel -y

# Install Maven
sudo yum install maven -y

# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-amazon-corretto
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-amazon-corretto' >> ~/.bashrc

# Create application directory
mkdir -p /home/ec2-user/tourist-app
cd /home/ec2-user/tourist-app

# If you have the code locally, upload it. Otherwise clone from git:
# git clone https://github.com/yourusername/tourist-guide-website.git .

# Build backend
cd backend || { echo "Error: backend directory not found"; exit 1; }
mvn clean package -DskipTests || { echo "Error: Maven build failed"; exit 1; }

# Create systemd service for backend
sudo tee /etc/systemd/system/tourist-backend.service > /dev/null <<EOF
[Unit]
Description=Tourist Guide Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/tourist-app/backend
ExecStart=/usr/bin/java -jar target/tourist-guide-0.0.1-SNAPSHOT.jar --server.port=8080
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for frontend
sudo tee /etc/systemd/system/tourist-frontend.service > /dev/null <<EOF
[Unit]
Description=Tourist Guide Frontend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/tourist-app
ExecStart=/usr/bin/python3 -m http.server 80
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
sudo systemctl daemon-reload || { echo "Error: Failed to reload systemd"; exit 1; }
sudo systemctl enable tourist-backend || { echo "Error: Failed to enable backend service"; exit 1; }
sudo systemctl enable tourist-frontend || { echo "Error: Failed to enable frontend service"; exit 1; }
sudo systemctl start tourist-backend || { echo "Error: Failed to start backend service"; exit 1; }
sudo systemctl start tourist-frontend || { echo "Error: Failed to start frontend service"; exit 1; }

# Check status
sudo systemctl status tourist-backend
sudo systemctl status tourist-frontend

echo "Deployment completed!"
echo "Backend API: http://your-ec2-ip:8080/api"
echo "Frontend: http://your-ec2-ip"