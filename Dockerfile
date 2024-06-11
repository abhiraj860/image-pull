# FROM docker:dind
# RUN apk add --no-cache nodejs npm
# WORKDIR /usr/src/app
# COPY ./package.json  ./
# COPY ./package-lock.json ./
# RUN npm install
# COPY ./server.js ./
# EXPOSE 3000
# COPY entrypoint.sh /usr/local/bin/
# RUN chmod +x /usr/local/bin/entrypoint.sh
# ENTRYPOINT ["entrypoint.sh"]
# CMD ["npm", "start"]



FROM docker:dind
RUN apk update && apk add --no-cache \
    nodejs \
    npm \
    python3 \
    py3-pip \
    && rm -rf /var/cache/apk/*
WORKDIR /usr/src/app
COPY ./package.json  ./
COPY ./package-lock.json ./
RUN npm install
COPY ./server.js ./
EXPOSE 3000
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
CMD ["npm", "start"]


# Use Docker-in-Docker (DinD) as the base image
# FROM docker:dind
# FROM ubuntu:latest AS base
# RUN apt-get update && apt-get install -y \
#     python3 \
#     python3-pip \
#     nodejs \
#     npm \
#     && rm -rf /var/cache/apt/*
# FROM base AS python
# WORKDIR /usr/src/app
# COPY requirements.txt .
# RUN pip3 install --no-cache-dir -r requirements.txt
# FROM base AS node
# WORKDIR /usr/src/app
# COPY ./package.json  ./
# COPY ./package-lock.json ./
# RUN npm install
# COPY ./server.js ./
# EXPOSE 3000
# COPY entrypoint.sh /usr/local/bin/
# RUN chmod +x /usr/local/bin/entrypoint.sh
# ENTRYPOINT ["entrypoint.sh"]
# CMD ["npm", "start"]