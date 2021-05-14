FROM node:12-alpine

RUN mkdir /app

ADD ./frontend /app

WORKDIR /app

RUN npm install

CMD ["npm", "run", "development"]



