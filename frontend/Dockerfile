FROM node:16-alpine

WORKDIR /app

# Instalar dependencias - cambiamos npm ci por npm install
COPY package.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Comando para desarrollo
CMD ["npm", "start"]