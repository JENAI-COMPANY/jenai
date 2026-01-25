#!/bin/bash

echo "======================================"
echo "🚀 JENAI Project Deployment Script"
echo "======================================"

# 1. Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
echo "✅ Node.js installed: $(node -v)"

# 2. Install PM2
echo "📦 Installing PM2..."
npm install -g pm2
echo "✅ PM2 installed"

# 3. Install Git
echo "📦 Installing Git..."
apt-get install -y git
echo "✅ Git installed"

# 4. Clone the project
echo "📥 Cloning JENAI project..."
cd /
if [ -d "jenai" ]; then
    echo "⚠️  Project exists, pulling latest changes..."
    cd jenai
    git pull
else
    git clone https://github.com/JENAI-COMPANY/jenai.git
    cd jenai
fi

# 5. Setup Backend
echo "🔧 Setting up Backend..."
cd /jenai/backend

# Create .env file
cat > .env << 'EOF'
PORT=5000
MONGODB_URI=mongodb://104.218.48.119:27017/jenai_db
DB_HOST=104.218.48.119
JWT_SECRET=jenai_super_secret_key_2024_change_in_production
NODE_ENV=production
EOF

echo "✅ .env file created"

# Install backend dependencies
echo "📦 Installing Backend dependencies..."
npm install

# 6. Setup Frontend
echo "🔧 Setting up Frontend..."
cd /jenai/frontend

# Install frontend dependencies
echo "📦 Installing Frontend dependencies..."
npm install

# Build frontend
echo "🏗️  Building Frontend..."
npm run build

# 7. Start Backend with PM2
echo "🚀 Starting Backend with PM2..."
cd /jenai/backend
pm2 delete jenai-backend 2>/dev/null || true
pm2 start server.js --name jenai-backend
pm2 save
pm2 startup

# 8. Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/jenai << 'EOF'
server {
    listen 80;
    server_name 104.218.48.119;

    # Frontend (React build)
    location / {
        root /jenai/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Uploads
    location /uploads {
        alias /jenai/backend/uploads;
    }
}
EOF

# Remove default nginx site
rm -f /etc/nginx/sites-enabled/default

# Enable jenai site
ln -sf /etc/nginx/sites-available/jenai /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx

echo ""
echo "======================================"
echo "✅ Deployment Complete!"
echo "======================================"
echo ""
echo "📊 Status:"
echo "  Backend: $(pm2 list | grep jenai-backend)"
echo "  Nginx: $(systemctl is-active nginx)"
echo ""
echo "🌐 Your website is now available at:"
echo "   http://104.218.48.119"
echo ""
echo "📝 Useful commands:"
echo "   pm2 logs jenai-backend  - View backend logs"
echo "   pm2 restart jenai-backend - Restart backend"
echo "   systemctl status nginx - Check nginx status"
echo ""
