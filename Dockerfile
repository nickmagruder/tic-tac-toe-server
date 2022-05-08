# syntax=docker/dockerfile:1

FROM node:12.19.0
ENV NODE_ENV=production

WORKDIR /tic-tac-toe-server

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

CMD [ "node", "server.js" ]
