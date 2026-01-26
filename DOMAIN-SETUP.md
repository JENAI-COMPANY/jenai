# Domain Configuration - jenai-4u.com

## Domain Information
- **Primary Domain:** jenai-4u.com
- **WWW Domain:** www.jenai-4u.com
- **IP Address:** 104.218.48.119

## SSL Certificate
- **Provider:** Let's Encrypt
- **Certificate Location:** /etc/letsencrypt/live/jenai-4u.com/
- **Auto-Renewal:** Enabled (via Certbot)
- **Renewal Check:** `sudo certbot renew --dry-run`

## Nginx Configuration
- **Config File:** /etc/nginx/sites-available/jenai
- **Enabled:** /etc/nginx/sites-enabled/jenai
- **HTTPS:** Enabled (port 443)
- **HTTP to HTTPS:** Auto-redirect enabled

## DNS Records (Required)
Make sure your DNS provider has these records:

```
Type    Name              Value
A       jenai-4u.com      104.218.48.119
A       www.jenai-4u.com  104.218.48.119
```

## URLs
- **Production:** https://jenai-4u.com
- **WWW:** https://www.jenai-4u.com
- **IP Access:** http://104.218.48.119 (redirects to HTTPS)

## Testing
- Test HTTPS: `curl -I https://jenai-4u.com`
- Test Redirect: `curl -I http://jenai-4u.com`
- SSL Status: `sudo certbot certificates`

## Maintenance
- Reload Nginx: `sudo systemctl reload nginx`
- Test Config: `sudo nginx -t`
- Check Logs: `sudo tail -f /var/log/nginx/error.log`
- SSL Renewal: Automatic (runs daily via systemd timer)
