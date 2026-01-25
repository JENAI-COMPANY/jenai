#!/bin/bash

echo "🔍 Checking nginx configuration..."

# Check sites-enabled
echo "Sites enabled:"
ls -la /etc/nginx/sites-enabled/

# Check if jenai site exists
echo ""
echo "Jenai site configuration:"
cat /etc/nginx/sites-available/jenai

# Check frontend build
echo ""
echo "Frontend build exists:"
ls -la /jenai/frontend/build/

# Fix nginx
echo ""
echo "🔧 Fixing nginx..."

# Remove default
rm -f /etc/nginx/sites-enabled/default

# Enable jenai site
rm -f /etc/nginx/sites-enabled/jenai
ln -s /etc/nginx/sites-available/jenai /etc/nginx/sites-enabled/jenai

# Test nginx
echo ""
echo "Testing nginx configuration:"
nginx -t

# Restart nginx
echo ""
echo "Restarting nginx..."
systemctl restart nginx

echo ""
echo "✅ Done!"
echo ""
echo "Sites enabled now:"
ls -la /etc/nginx/sites-enabled/

echo ""
echo "Nginx status:"
systemctl status nginx --no-pager | head -10
