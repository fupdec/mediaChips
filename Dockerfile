FROM node:18-alpine

# Установка зависимостей для медиаобработки
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

WORKDIR /app

# Копируем package.json отдельно для кеширования
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Создаем необходимые директории
RUN mkdir -p /app/app_storage /app/public

# Создаем не-root пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

# Фиксированный порт из твоего сервера
EXPOSE 12321

# Запуск сервера
CMD ["node", "server.js"]