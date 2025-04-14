# ./frontend/Dockerfile
FROM node:23-alpine

WORKDIR /app

# Install dependencies first (leverages Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm ci                     

# Copy the rest of the source
COPY . .

# ---------- Development image ----------
# Expose port & run the dev server
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "-p", "3000", "-H", "0.0.0.0"]

# ---------- Production (optional) ----------
# If you later want a prod‑only image, add:
# RUN npm run build
# CMD ["npm", "start"]