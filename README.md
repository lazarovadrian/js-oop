# Social Link Analyzer

Веб-приложение для анализа сайтов и поиска ссылок на социальные платформы (Google, Facebook, Twitter/X, Instagram).

## 🚀 Возможности

- Анализ главной страницы и внутренних страниц сайта
- Поиск ссылок на: Google, Facebook, Twitter/X, Instagram
- Красивый адаптивный интерфейс
- Детальный отчет с указанием страницы и текста ссылки
- Статистика по каждой социальной платформе

## 📋 Требования

- Node.js версии 14 или выше
- npm (поставляется с Node.js)

## 🛠️ Установка и запуск

### 1. Клонирование репозитория

```bash
git clone <url-вашего-репозитория>
cd social-link-analyzer
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Запуск приложения

#### Для разработки:
```bash
npm start
```

#### Для продакшена (с PM2):
```bash
# Установить PM2 глобально
npm install -g pm2

# Запустить приложение
pm2 start server.js --name social-analyzer

# Сохранить конфигурацию для автозапуска после перезагрузки
pm2 save

# Настроить автозапуск при загрузке системы
pm2 startup
```

Приложение будет доступно по адресу: `http://localhost:3000`

## 🌐 Развертывание на сервере

### Вариант 1: Прямое развертывание на VPS

#### Шаг 1: Подготовка сервера (Ubuntu/Debian)

```bash
# Обновить пакеты
sudo apt update && sudo apt upgrade -y

# Установить Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установить Git
sudo apt install -y git

# Установить PM2
sudo npm install -g pm2
```

#### Шаг 2: Клонирование и настройка

```bash
# Клонируйте репозиторий
git clone <url-вашего-репозитория>
cd social-link-analyzer

# Установите зависимости
npm install --production
```

#### Шаг 3: Запуск через PM2

```bash
pm2 start server.js --name social-analyzer
pm2 save
pm2 startup
```

#### Шаг 4: Настройка Nginx (опционально, для доступа через домен)

```bash
# Установить Nginx
sudo apt install -y nginx

# Создать конфигурационный файл
sudo nano /etc/nginx/sites-available/social-analyzer
```

Добавьте следующую конфигурацию:

```nginx
server {
    listen 80;
    server_name ваш-домен.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активируйте сайт и перезапустите Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/social-analyzer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Шаг 5: Настройка SSL (рекомендуется)

```bash
# Установить Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить SSL сертификат
sudo certbot --nginx -d ваш-домен.com
```

### Вариант 2: Развертывание с Docker

#### Шаг 1: Создание Dockerfile

Создайте файл `Dockerfile` в корне проекта:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### Шаг 2: Сборка и запуск контейнера

```bash
# Собрать образ
docker build -t social-link-analyzer .

# Запустить контейнер
docker run -d -p 3000:3000 --name social-analyzer social-link-analyzer
```

#### Шаг 3: Использование Docker Compose (рекомендуется)

Создайте файл `docker-compose.yml`:

```yaml
version: '3.8'

services:
  social-analyzer:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

Запуск:

```bash
docker-compose up -d
```

### Вариант 3: Развертывание на облачных платформах

#### Heroku

1. Установите Heroku CLI
2. Выполните команды:

```bash
heroku login
heroku create your-app-name
git push heroku main
heroku ps:scale web=1
```

#### Railway.app

1. Зарегистрируйтесь на [railway.app](https://railway.app)
2. Подключите GitHub репозиторий
3. Приложение развернется автоматически

#### Render.com

1. Зарегистрируйтесь на [render.com](https://render.com)
2. Создайте новый Web Service
3. Подключите репозиторий
4. Используйте команду запуска: `node server.js`

## 🔧 Конфигурация

Приложение использует следующие параметры (можно изменить в `server.js`):

- **Порт**: 3000 (по умолчанию)
- **Максимальное количество страниц для анализа**: 10
- **Таймаут запроса**: 5000 мс

## 📊 Использование

1. Откройте приложение в браузере
2. Введите URL сайта для анализа (например, `https://example.com`)
3. Нажмите кнопку "Анализировать"
4. Дождитесь завершения анализа
5. Просмотрите отчет с найденными социальными ссылками

## 📁 Структура проекта

```
social-link-analyzer/
├── server.js              # Серверная часть (Node.js + Express)
├── public/
│   └── index.html         # Клиентская часть (HTML + CSS + JS)
├── package.json           # Зависимости и скрипты
├── README.md              # Этот файл
├── Dockerfile             # Конфигурация Docker (опционально)
└── docker-compose.yml     # Docker Compose (опционально)
```

## 🔒 Безопасность

- Реализована защита от SSRF атак (проверка внутренних IP)
- Ограничение на анализ только внешних ресурсов
- Валидация пользовательского ввода

## 📝 Лицензия

MIT

## 🤝 Вклад

Принимаются pull request'ы и предложения по улучшению!

## 📞 Поддержка

При возникновении проблем создайте issue в репозитории.
