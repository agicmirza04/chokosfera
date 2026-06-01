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
