# syntax=docker/dockerfile:1.3-labs

ARG NODE_IMAGE=node:current-alpine3.20
ARG OPENAI_API_KEY="blaba"

###################################################
###### STAGE 1: Copy artifacts ####################
###################################################
FROM $NODE_IMAGE as build_artifacts

ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=${OPENAI_API_KEY}

RUN apk upgrade

# Install dependencies
RUN apk add git

RUN mkdir /app
WORKDIR /app

COPY . .
RUN npm install
RUN npm run build 

# Expose the port nginx is reachable on
EXPOSE 3000

CMD ["npm", "run", "start"]