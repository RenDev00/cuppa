# Deploying Cuppa on VPS (Ubuntu 22.04)

## Prerequisites
- VPS with Ubuntu 22.04 LTS
- SSH access to your VPS
- Node.js 20+ installed on VPS

---

## Step 1: Set Up VPS

### Connect to your VPS:

```bash
ssh user@your-vps-ip
```

### Install Node.js (if not installed):

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install nodejs
```

### Install PM2 and Nginx:

```bash
sudo npm install -g pm2
sudo apt install nginx
```

---

## Step 2: Transfer Files to VPS

On your VPS:

```bash
cd /var/www
git clone https://github.com/RenDev00/cuppa.git
cd cuppa
npm install
npm run build
npm prune --production
```

---

## Step 3: Configure Nginx as Reverse Proxy

### Create Nginx config:

```bash
sudo vim /etc/nginx/sites-available/cuppa
```

### Add configuration:

```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;   # or your domain later

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/cuppa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 4: Start the Application with PM2

### Start the server:

```bash
cd /var/www/cuppa
pm2 start server/index.js --name cuppa
```

### Configure PM2 to start on boot:

```bash
pm2 startup
pm2 save
```

---

## Step 5: Verify Deployment

### Check if running:

```bash
pm2 status
pm2 logs cuppa
```

### Access your app:

```
http://YOUR_VPS_IP
```

---

## Managing Your App

| Command | Description |
|---------|-------------|
| `pm2 restart cuppa` | Restart the app |
| `pm2 logs cuppa` | View logs |
| `pm2 monit` | Real-time monitoring |
| `pm2 stop cuppa` | Stop the app |
| `pm2 delete cuppa` | Remove from PM2 |

---

## Updating the App

```bash
# Pull latest code
cd /var/www/cuppa
git pull

# Rebuild if needed
npm run build
npm prune --production

# Restart
pm2 restart cuppa
```

---

## Optional: Add a Domain Later

When you get a domain:

1. Point domain A record to your VPS IP
2. Update Nginx config with `server_name yourdomain.com`
3. Add SSL with Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```
