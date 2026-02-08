#!/bin/bash

echo "======================================"
echo "🔄 JENAI Quick Update Script"
echo "======================================"

# Server IP
SERVER_IP="104.218.48.119"
PROJECT_PATH="/jenai"

echo "📥 Pulling latest changes from GitHub..."
cd ${PROJECT_PATH}
git pull origin main

echo ""
echo "🔧 Installing Backend dependencies..."
cd ${PROJECT_PATH}/backend
npm install

echo ""
echo "🔧 Installing Frontend dependencies..."
cd ${PROJECT_PATH}/frontend
npm install

echo ""
echo "🏗️  Building Frontend..."
npm run build

echo ""
echo "🔄 Restarting Backend with PM2..."
pm2 restart jenai-backend

echo ""
echo "🔄 Reloading Nginx..."
systemctl reload nginx

echo ""
echo "======================================"
echo "✅ Update Complete!"
echo "======================================"
echo ""
echo "📊 Status Check:"
pm2 status jenai-backend
echo ""
echo "🌐 Website: http://${SERVER_IP}"
echo ""
echo "📝 View logs: pm2 logs jenai-backend"
echo ""
