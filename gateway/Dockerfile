FROM node:20-alpine

WORKDIR /usr/src/app

COPY relay-server.js ./

EXPOSE 5000
EXPOSE 16567
EXPOSE 10000-20000

CMD ["node", "relay-server.js", "5000"]
