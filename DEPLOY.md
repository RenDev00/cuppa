# Deploying Cuppa on VPS (Ubuntu 22.04)

## Prerequisites
- VPS with Ubuntu 22.04 LTS
- SSH access to your VPS
- Node.js 18+ installed on VPS

---

## Step 1: Prepare Your Local Code

### Update package.json scripts for production:

```json
{
  "scripts": {
    "dev": "vite --host --port 5173",
    "dev:server": "node server/index.js",
    "build": "vite build",
    "preview": "vite preview --host",
    "start": "NODE_ENV=production node server/index.js"
  }
}
```

---

## Step 2: Set Up VPS

### Connect to your VPS:

```bash
ssh user@your-vps-ip
```

### Install Node.js (if not installed):

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
```

### Install PM2 and Nginx:

```bash
sudo npm install -g pm2
sudo apt install nginx
```

---

## Step 3: Transfer Files to VPS

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

## Step 4: Configure Nginx as Reverse Proxy

### Create Nginx config:

```bash
sudo nano /etc/nginx/sites-available/cuppa
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

## Step 5: Start the Application with PM2

### Start the server:

```bash
cd /var/www/cuppa
pm2 start server/index.js --name cuppa
```

### Configure PM2 to start on boot:

```bash
pm2 startup
# Follow the output instructions (run the generated command)
pm2 save
```

---

## Step 6: Verify Deployment

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
