FROM node:12

RUN rm -rf /live
RUN mkdir -p /live
WORKDIR /live

COPY . /live

RUN echo "{}" > /live/backend/userstate.json

RUN cd /live/backend && npm install

RUN cd /live/frontend && npm install && npm run build && \
  cp -R /live/frontend/build/. /live/backend/public/

WORKDIR /live/backend

EXPOSE 3600

CMD ["npm", "start", "-b", "0.0.0.0"]
