# ---- BASE IMAGE ----
# Node 20 LTS, lightweight base image
FROM node:20-alpine AS base
WORKDIR /app

#catch and copy both package.json and package-lock.json
COPY package*.json ./
RUN npm install


# ---- DEVELOPMENT ----
FROM base AS dev
# copy rest of code
WORKDIR /app
COPY . .
EXPOSE 4000
RUN npx prisma generate
CMD ["npm", "run", "dev"]

# ---- PRODUCTION ----
FROM base AS prod
WORKDIR /app
COPY . .
EXPOSE 4000
RUN npx prisma generate
RUN npm run build
CMD ["npm", "start"]

