# Chokosfera Setup Guide

## What Was Fixed

The app was running **Apache + PHP** but the authentication logic was in **Node.js (Express)**. This caused 404 errors on `/api/register` and `/api/login` endpoints.

### Changes Made:

1. **Dockerfile** - Switched from Apache/PHP to Node.js
2. **package.json** - Added missing `mysql2` dependency
3. **server.js** - Already correct (no changes needed)
4. **chokosfera.html** - Already correct (no changes needed)

---

## Files Changed

### 1. Dockerfile (COMPLETE REPLACEMENT)

**Location:** `/Dockerfile`

**Old Content (Apache/PHP):**
```dockerfile
FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    apache2 \
    php8.1 \
    php8.1-mysql \
    libapache2-mod-php8.1 \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /var/www/html/index.html
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html
RUN echo "Listen 8080" > /etc/apache2/ports.conf
RUN sed -i 's/<VirtualHost \*:80>/<VirtualHost *:8080>/' /etc/apache2/sites-enabled/000-default.conf
RUN echo "DirectoryIndex chokosfera.html index.php index.html" >> /etc/apache2/apache2.conf
EXPOSE 8080
CMD ["apache2ctl", "-D", "FOREGROUND"]
