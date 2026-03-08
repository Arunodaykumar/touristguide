# AWS EC2 Free Tier Deployment Guide

## EC2 Free Tier Specifications
- **Instance Type**: t2.micro (1 vCPU, 1 GB RAM)
- **Storage**: 30 GB EBS General Purpose SSD
- **Data Transfer**: 15 GB outbound per month
- **Duration**: 12 months free

## Step 1: Launch EC2 Instance

1. **Login to AWS Console** → EC2 Dashboard
2. **Launch Instance**:
   - AMI: Amazon Linux 2023 (Free tier eligible)
   - Instance Type: t2.micro
   - Key Pair: Create new or use existing
   - Security Group: Allow HTTP (80), HTTPS (443), SSH (22)

## Step 2: Connect to EC2 Instance

```bash
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

## Step 3: Install Required Software

```bash
# Update system
sudo yum update -y

# Install Java 17
sudo yum install java-17-amazon-corretto-devel -y

# Install Maven
sudo yum install maven -y

# Install Git
sudo yum install git -y

# Install Node.js (for frontend build tools if needed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

## Step 4: Deploy Application

```bash
# Clone your repository
git clone https://github.com/yourusername/tourist-guide-website.git
cd tourist-guide-website

# Build and run backend
cd backend
mvn clean package
nohup java -jar target/tourist-guide-0.0.1-SNAPSHOT.jar --server.port=8080 > app.log 2>&1 &

# Serve frontend (simple HTTP server)
cd ..
python3 -m http.server 80 > frontend.log 2>&1 &
```

## Step 5: Configure Security Group

**Inbound Rules**:
- SSH (22): Your IP
- HTTP (80): 0.0.0.0/0
- Custom TCP (8080): 0.0.0.0/0 (for API)

## Step 6: Domain Setup (Optional)

1. **Get Elastic IP** (Free for running instances)
2. **Configure DNS** with your domain provider
3. **Setup SSL** using Let's Encrypt (free)

## Cost Optimization Tips

1. **Stop instance** when not in use
2. **Use CloudWatch** to monitor usage
3. **Set billing alerts** at $1, $5, $10
4. **Monitor data transfer** (15GB/month limit)

## Monitoring Commands

```bash
# Check application status
ps aux | grep java
ps aux | grep python

# Check logs
tail -f backend/app.log
tail -f frontend.log

# Check system resources
htop
df -h
```

## Backup Strategy

```bash
# Create AMI snapshot weekly
# Backup code to GitHub
# Export database (if using RDS later)
```

## Free Tier Limits to Watch

- **750 hours/month** EC2 usage
- **30 GB EBS storage**
- **15 GB data transfer out**
- **1 million requests** (if using Load Balancer later)