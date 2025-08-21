# Node 20 LTS, lightweight base image
FROM node:20-alpine

WORKDIR /app

#catch and copy both package.json and package-lock.json
COPY vvv-site-backend/package*.json ./
RUN npm install --production

# copy rest of code
COPY vvv-site-backend/ ./

#compile to js
RUN npx tsc

#specify container's port
EXPOSE 4000

CMD ["node", "dist/index.js"]

