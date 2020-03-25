#!/bin/sh

cd /app/node_modules/.bin
ln -s ../../src/config/external.js uruguay
cd /app

exec "$@"
