FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p public/uploads

# Expose port
EXPOSE 5001

# Start application
CMD ["npm", "start"]

