FROM docker:1.10.3-dind

MAINTAINER David Bruant <bruant.d@gmail.com>

RUN docker pull mhart/alpine-node

# copy steps of alpine-node

# where the current node app will be provided
VOLUME /home/node-app