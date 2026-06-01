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
```

**New Content (Node.js):**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --omit=dev

# Copy entire app
COPY . .

# Expose port 8080
EXPOSE 8080

# Set environment variable for port
ENV PORT=8080

# Start the Node.js server
CMD ["npm", "start"]
```

---

### 2. package.json (ADD MISSING DEPENDENCY)

**Location:** `/package.json`

**What to change:** Add `mysql2` to the `dependencies` section

**Old:**
```json
"dependencies": {
  "bcryptjs": "^3.0.3",
  "dotenv": "^16.0.0",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.0"
}
```

**New:**
```json
"dependencies": {
  "bcryptjs": "^3.0.3",
  "dotenv": "^16.0.0",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.0",
  "mysql2": "^3.6.5"
}
```

**Complete file:**
```json
{
  "name": "chokosfera-backend",
  "version": "1.0.0",
  "description": "Simple backend for Chokosfera (auth + static)",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test tests/e2e"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "dotenv": "^16.0.0",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "mysql2": "^3.6.5"
  },
  "devDependencies": {
    "@playwright/test": "^1.60.0",
    "jest": "^30.0.0"
  },
  "jest": {
    "testPathIgnorePatterns": [
      "/node_modules/",
      "/tests/e2e/"
    ]
  }
}
```

---

### 3. server.js (NO CHANGES NEEDED)

Your `server.js` is already correct. It has:
- ✅ Express server setup
- ✅ `/api/register` endpoint
- ✅ `/api/login` endpoint
- ✅ Database connection logic
- ✅ Static file serving via `express.static()`
- ✅ CORS headers configured

---

### 4. chokosfera.html (NO CHANGES NEEDED)

Your HTML is already correct. It has:
- ✅ Login form that POSTs to `/api/login`
- ✅ Register form that POSTs to `/api/register`
- ✅ Correct API base URL detection

---

## Environment Variables Required

Set these in Railway dashboard under your service's Variables:

```
PORT=8080
DB_HOST=<your-mysql-host>
DB_PORT=3306
DB_USER=<your-mysql-user>
DB_PASS=<your-mysql-password>
DB_NAME=chokosfera
JWT_SECRET=<generate-a-random-secret>
ADMIN_EMAIL=sarah.karacic@gmail.com
ADMIN_PASSWORD=donutsarajevo
```

Or if using a single DATABASE_URL:
```
DATABASE_URL=mysql://user:password@host:port/chokosfera
```

---

## How to Deploy

1. **Update your files:**
   - Replace `Dockerfile` with the new Node.js version
   - Update `package.json` to add `mysql2` dependency

2. **Commit and push:**
   ```bash
   git add Dockerfile package.json
   git commit -m "Fix: Switch from Apache to Node.js for auth endpoints"
   git push origin main
   ```

3. **Railway will auto-deploy** (if auto-deploy is enabled)

4. **Test the endpoints:**
   - Go to your app: `https://chokosfera-production.up.railway.app`
   - Try registering a new account
   - Try logging in

---

## What Happens Now

1. **Build:** Docker builds a Node.js image
2. **Install:** npm installs dependencies (express, bcryptjs, jsonwebtoken, mysql2)
3. **Start:** `npm start` runs `node server.js`
4. **Server:** Express starts on port 8080
5. **Static files:** Served from the root directory
6. **API endpoints:** `/api/register` and `/api/login` now work
7. **Database:** Connects to your MySQL database

---

## Troubleshooting

### Still getting 404 on /api/register?
- Check that the new Dockerfile is deployed (look at build logs)
- Verify PORT=8080 is set in environment variables
- Check that mysql2 is in package.json

### Database connection errors?
- Verify DB_HOST, DB_USER, DB_PASS, DB_NAME are set correctly
- Check that your MySQL service is running
- Look at deployment logs for connection errors

### Port issues?
- Railway expects the app to listen on the PORT environment variable
- server.js reads: `const PORT = process.env.PORT || 3000;`
- Make sure PORT=8080 is set in Railway variables

---

## Summary

| File | Change | Reason |
|------|--------|--------|
| Dockerfile | Complete rewrite | Switch from Apache/PHP to Node.js |
| package.json | Add mysql2 | server.js needs it for database |
| server.js | None | Already correct |
| chokosfera.html | None | Already correct |

That's it! Your register and login endpoints will work once deployed.

