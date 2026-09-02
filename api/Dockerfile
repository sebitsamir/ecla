FROM node:24-bookworm-slim AS build
WORKDIR /app/api
COPY api/package*.json ./
RUN npm ci
COPY api ./
RUN npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app/api
COPY api/package*.json ./
RUN npm ci --omit=dev --omit=optional && npm cache clean --force
COPY --from=build /app/api/dist ./dist
COPY --from=build /app/api/prisma ./prisma
COPY --from=build /app/api/node_modules/.prisma ./node_modules/.prisma
USER node
EXPOSE 4000
CMD ["node", "dist/api/src/server.js"]
