FROM node:12

RUN rm -rf /live
RUN mkdir -p /live
WORKDIR /live

COPY . /live

RUN cd /live/backend && npm install && \
  cd /live/frontend && npm install && npm run build && \
  cp -R /live/frontend/build/. /live/backend/public/

WORKDIR /live/backend
CMD ["npm", "start", "-b", "0.0.0.0"]
