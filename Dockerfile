FROM node:20.11.1
USER node
RUN mkdir /home/node/app
WORKDIR /home/node/app
COPY --chown=node package*.json ./
RUN npm install
COPY --chown=node . /home/node/app
CMD ["node", "main.js"]
