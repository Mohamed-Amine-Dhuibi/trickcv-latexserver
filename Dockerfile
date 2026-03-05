# Use official Node.js runtime as base image
FROM node:18-slim

# Install LaTeX and required packages
RUN apt-get update && apt-get install -y \
    texlive-full \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p temp output

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
