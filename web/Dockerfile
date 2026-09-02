FROM node:24-bookworm-slim AS build
WORKDIR /app/web
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ANALYTICS_ENABLED=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ANALYTICS_ENABLED=$NEXT_PUBLIC_ANALYTICS_ENABLED
COPY web/package*.json ./
RUN npm ci
COPY web ./
RUN npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/web/.next ./.next
COPY --from=build /app/web/public ./public
COPY --from=build /app/web/next.config.ts ./next.config.ts
USER node
EXPOSE 3000
CMD ["npm", "start"]
