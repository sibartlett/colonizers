FROM node:0.12-slim
MAINTAINER Simon Bartlett

WORKDIR /usr/src/app

ADD https://raw.githubusercontent.com/colonizers/colonizers/master/package.json ./package.json

ENV buildDeps='gcc git make python'

RUN set -x \
&&  apt-get update \
&&  apt-get install -y $buildDeps --no-install-recommends \
&&  rm -rf /var/lib/apt/lists/* \
&&  npm install --production \
&&  npm dedupe \
&&  npm cache clean \
&&  rm -rf /tmp/npm* \
&&  apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false -o APT::AutoRemove::SuggestsImportant=false $buildDeps

ADD https://github.com/colonizers/colonizers/archive/master.tar.gz ./master.tar.gz

RUN tar -xzvf master.tar.gz \
&&  cp -a colonizers-master/. . \
&&  rm -rf colonizers-master

RUN groupadd -r node \
&&  useradd -r -g node node

ENV COLONIZERS_HOST 0.0.0.0
ENV COLONIZERS_PORT 8080
ENV NODE_ENV production
ENV COLONIZERS_MONGO_URL mongodb://mongo/colonizers
ENV COLONIZERS_RABBITMQ_URL amqp://rabbitmq/

VOLUME /usr/src/app/server

EXPOSE 8080

USER node

CMD ["npm", "start"]
