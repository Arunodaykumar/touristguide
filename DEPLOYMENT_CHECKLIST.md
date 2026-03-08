# EC2 Deployment Checklist

## Pre-deployment
- [ ] AWS Account setup with free tier
- [ ] Key pair created and downloaded
- [ ] Code pushed to GitHub (optional)

## EC2 Instance Setup
- [ ] Launch t2.micro instance (Amazon Linux 2023)
- [ ] Configure Security Group (ports 22, 80, 8080)
- [ ] Connect via SSH
- [ ] Run startup.sh script

## Application Deployment
- [ ] Upload/clone project code
- [ ] Build backend with Maven
- [ ] Start backend service (port 8080)
- [ ] Start frontend service (port 80)
- [ ] Test both services

## Post-deployment
- [ ] Test website: http://your-ec2-ip
- [ ] Test API: http://your-ec2-ip:8080/api/destinations
- [ ] Setup monitoring/alerts
- [ ] Configure domain (optional)

## Free Tier Monitoring
- [ ] Set billing alerts
- [ ] Monitor EC2 usage (750 hours/month)
- [ ] Monitor data transfer (15 GB/month)
- [ ] Stop instance when not needed

## Commands for EC2

```bash
# Check services status
sudo systemctl status tourist-backend
sudo systemctl status tourist-frontend

# View logs
sudo journalctl -u tourist-backend -f
sudo journalctl -u tourist-frontend -f

# Restart services
sudo systemctl restart tourist-backend
sudo systemctl restart tourist-frontend

# Stop instance to save costs
sudo shutdown -h now
```