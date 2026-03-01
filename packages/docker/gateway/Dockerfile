FROM node:22-slim

RUN npm install -g claw-guard

EXPOSE 19280

ENTRYPOINT ["claw-guard", "serve", "--host", "0.0.0.0", "--port", "19280"]
