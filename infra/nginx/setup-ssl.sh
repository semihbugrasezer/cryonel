#!/bin/sh

# SSL Certificate Setup Script for CRYONEL
# This script sets up Let's Encrypt SSL certificates for the domain

DOMAIN=${DOMAIN:-"your-domain.com"}
EMAIL=${SSL_EMAIL:-"admin@your-domain.com"}

echo "Setting up SSL certificates for domain: $DOMAIN"

# Check if certificates already exist
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "SSL certificates already exist for $DOMAIN"
    exit 0
fi

# Generate initial certificate
certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN,www.$DOMAIN

if [ $? -eq 0 ]; then
    echo "SSL certificates generated successfully"
    
    # Set up automatic renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    echo "Auto-renewal cron job set up"
else
    echo "Failed to generate SSL certificates"
    echo "Make sure:"
    echo "1. Domain $DOMAIN points to this server"
    echo "2. Port 80 is accessible from the internet"
    echo "3. No other web server is running on port 80"
    exit 1
fi