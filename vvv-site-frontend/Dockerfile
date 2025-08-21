
# Node 20 LTS, lightweight base image
FROM node:20-alpine

WORKDIR /app

#catch and copy both package.json and package-lock.json
COPY vvv-site-frontend/package*.json ./
RUN npm install 

# copy rest of code
COPY vvv-site-frontend/ ./

#build Next app
RUN npm run build

#specify container's port
EXPOSE 3000 

CMD ["npm", "start"]

