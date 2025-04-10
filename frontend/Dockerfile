FROM node:18-alpine
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --omit=dev

COPY frontend .
RUN npm run build

# serve static files with a tiny server
RUN npm i -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]