
FROM node:10-stretch

RUN apt-get update && apt-get install -yq libgconf-2-4 make zip python python-pip psmisc nano git-all
# awscli
# Install the AWS SDK
RUN pip install "awscli==1.15.63"

RUN mkdir -p /app/build

WORKDIR /app

ADD package.json package.json
ADD package-lock.json package-lock.json

ARG GITHUB_TOKEN

# Add rewrite rule to authenticate with Github or private repos
RUN git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"

RUN npm install

RUN cp /app/node_modules/ultimake/src/aliases.sh /etc/profile.d/aliases.sh
