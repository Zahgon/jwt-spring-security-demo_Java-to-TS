FROM node:22-alpine
LABEL maintainer="Stephan Zerhusen <strephan.zerhusen@gmail.com>"

WORKDIR /usr/share/jwt-spring-security-demo

# Install production dependencies against the lockfile first so the layer caches.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# The compiled output plus the resources that used to live on the Spring classpath.
COPY dist ./dist

EXPOSE 8080
ENTRYPOINT ["node", "dist/index.js"]
