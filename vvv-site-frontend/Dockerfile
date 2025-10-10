# ---- BASE ----
# Node 20 LTS, lightweight base image
FROM node:20-alpine AS base

WORKDIR /app

#catch and copy both package.json and package-lock.json
COPY package*.json ./
RUN npm install 

# ---- DEVELOPMENT ---
FROM base AS dev
WORKDIR /app
# copy rest of code
COPY . .
CMD ["npm", "run", "dev"]

# ---- PRODUCTION (build) ----
FROM base AS build
WORKDIR /app
COPY . .
RUN npm run build

# ---- PRODUCTION (runtime) ----
FROM node:20-alpine AS prod
WORKDIR /app

COPY --from=build /app/package*.json ./
RUN npm install --only=production
EXPOSE 3000 

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts

CMD ["npm", "run", "start"]

