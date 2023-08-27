# Описание
На реализации проект бронирования отелей

За основу было взято ТЗ [Cайт-агрегатор просмотра и бронирования гостиниц](https://github.com/netology-code/fjs-diplom)

Приложение имеет учебный характер и создано для постепенного усложнения и утяжеления архитектуры, а также увеличения бизнес-логики посредством добавления различных инструментов

## Технический стек frontend-приложения:

1. React
2. Typescript
3. Tailwind CSS
4. Redux Saga
5. Redux Thunk
6. React Router
7. Socket.io
8. Webpack

## Технический стек backend-приложения:

1. NestJS
2. Typescript
3. Mongoose
4. JWT-Auth(assets_token + refresh_token)
5. Socket.IO

## Функционал приложения:

+  для всех пользователей:

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/all_main.jpg)

1. Регистрация

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/authentication.jpg)

2. Авторизация

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/all_authorization.jpg)

3. Поиск отелей(с выдачей отелей с свободными номерами на заданную дату)

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/all_search.jpg)

4. Добавление отеля в избранное
5. Просмотр избранных отелей

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/all_favorites.jpg)

6. Просмотр страницы отеля и номеров в нем

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/all_hotelPage_1.jpg)
![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/all_hotelPage_2.jpg)

+ для роли клиент:

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/client_main.jpg)

7. Обращение в техподдержку

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/client_supports.jpg)

8. Получение истории сообщений

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/client_support.jpg)

9. Возможность забронировать номер

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/client_hotelPage.jpg)

10. Создание брони

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/client_reservation.jpg)

11. Просмотр своих броней

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/client_reservations.jpg)

+ для роли админ:

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/admin_main.jpg)

12. Создание отеля, номеров, редактирования и удаления

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/admin_newhotel.jpg)

13. Просмотр всех пользователей и добавление их

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/admin_users.jpg)

+ для роли менеджер:

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/manager_main.jpg)

14. Просмотр всех активних броней и их удаление

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/manager_reservations.jpg)

15. Получение обращений в техподдержку от клиентов и написание ответа

![f](https://github.com/Stanislavsus-prj/hotelBooking_react_front/blob/main/readme_pictures/manager_supports.jpg)  

## Навигация проекта в каталоге src фронтенда:

1. api - функции для осуществления fetch запросов и socket сообщений на сервер
2. pages - компоненты приложения в одноименных папках с тайпингами по их наличию, а также папка images со статическими изображениями
3. reducers - редьюсеры редакс состояний приложения и тайпинги используемые в редьюсерах 
4. sagas - watcher'ы и worker'ы
5. store - кофигурация stor'а react приложения и объявления хуков react-redux
6. App.tsx - роутинг приложения

## Навигация проекта в каталоге src бэкенда:

1. Auth - классы аутентификационных стратегий и защитники вебсокетных сообщений
2. Controllers - контроллеры по встроенной архитектуре NestJS приложений
3. Decorators - кастомные декораторы
4. Interface - тайпинги приходящих и уходящих данных на фронтенд
5. Models - интерфейсы коллекций базы данных Монго
6. Modules - модули по встроенной архитектуре NestJS приложений
7. Providers - провайдеры по встроенной архитектуре NestJS приложений

## Варианты запуска приложения:
1. Из Docker контейнера
- ```git clone https://github.com/Stanislavsus-prj/hotelBooking_fullstack.git```
- ```docker compose up```
- Откройте в браузере ```http://localhost:3000```
2. При наличии NodeJS
- ```git clone https://github.com/Stanislavsus-prj/hotelBooking_fullstack.git```
- ```cd hotelBooking_nest_back && npm install && npm start```
- ```cd hotelBooking_react_front && npm install && npm start```

## Доступ 

менеджер - string1@mail.ru - 12345789qwertyuio

админ - string@mail.ru - 12345789qwertyuio

клиент - client3@mail.ru - password
