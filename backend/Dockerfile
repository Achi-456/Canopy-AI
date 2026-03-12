FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy application code
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
