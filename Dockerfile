FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY public ./public

RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV OLLAMA_URL=http://ollama:11434
ENV PORT=3000

CMD ["npm", "start"]
