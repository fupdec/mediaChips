```
npm install --build-from-source
```
> working with node v.14
## Production

1. compile frontend files into folder /dist
```
npm build
```

2. first run of server / app (for creating config files, database)
```
npm server
```

## Development

1. compile frontend files into folder /dist
```
npm build
```
2. first run of server / app (for creating config files, database)
```
npm server
```
3. copy file "config.json" from /dist to /public
4. change IP to local in file "config.json"
5. run server for development and autorestart after changing app files
```
npm server-dev
```
6. run vue service
```
npm serve
```

## Description of npm commands
- serve - for frontend development
- build - compile frontend files
- lint - testing frontend
- server - start server / app
- server-dev - start server / app for development
- electron - run app as electron window
- pack - compile app for electron production
- portable - compile app for electron production (only Windows OS)
- dist - compile app for electron production

## Description of project folders
- api - DB description, etc.
- api/controllers - CRUD commands, DB management
- api/migrations - app migration scipts
- api/models - table models for DB
- api/routes - list of URL for server commands
- app - main folder with server script
- databases - created dynamically. folder with DB files: sqlite, images
- dist - created dynamically. compiled frontend files for production
- electron - main script for running app in electron window
- public - static files for dev
- src - files for dev


## Решение проблем:

sqlite3 на Mac M1 требует python2 для компиляции под архитектуру процессора arm64.
команда для генерации файлов под электрон.

```
npm install sqlite3 --build-from-source --target_arch=arm64 --fallback-to-build;
```
для работы sqlite3 как обычно, нужно перезапускать его установку

```
npm install sqlite3;
```

sqlite3 версии 5.1.6 хорошо работает как на macOS так и на Windows 11

чтобы не приходилось билдить sqlite3 отдельно для электрон, а отдельно для разработки, 
нужно запустить одновременно скрипты для разработки и запустить электрон приложение

## Подпись на macOS

```
# Дайте права скриптам
chmod +x scripts/*.sh

# Запустите полный процесс
npm run release

# Или по шагам:
npm run create-cert   # 1. Создать сертификат
npm run build        # 2. Собрать приложение
npm run sign         # 3. Подписать
npm run dmg          # 4. Создать DMG
```

## Примечание 

Electron >32 удаляет папку databases 