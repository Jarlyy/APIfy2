# Примеры API для тестирования

## Публичные API без аутентификации

### 1. JSONPlaceholder (Тестовый REST API)

**GET запрос - получить пост**
- URL: `https://jsonplaceholder.typicode.com/posts/1`
- Метод: GET
- Заголовки: `{}`

**POST запрос - создать пост**
- URL: `https://jsonplaceholder.typicode.com/posts`
- Метод: POST
- Заголовки: `{}`
- Тело:
```json
{
  "title": "Тестовый пост",
  "body": "Содержимое поста",
  "userId": 1
}
```

**GET запрос - список постов**
- URL: `https://jsonplaceholder.typicode.com/posts`
- Метод: GET
- Заголовки: `{}`

### 2. ReqRes (Тестовый API для пользователей)

**GET запрос - список пользователей**
- URL: `https://reqres.in/api/users?page=1`
- Метод: GET
- Заголовки: `{}`

**POST запрос - создать пользователя**
- URL: `https://reqres.in/api/users`
- Метод: POST
- Заголовки: `{}`
- Тело:
```json
{
  "name": "Иван",
  "job": "Разработчик"
}
```

### 3. CoinGecko (Криптовалюты)

**GET запрос - цена Bitcoin**
- URL: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`
- Метод: GET
- Заголовки: `{}`

### 4. REST Countries (Информация о странах)

**GET запрос - информация о России**
- URL: `https://restcountries.com/v3.1/name/russia`
- Метод: GET
- Заголовки: `{}`

### 5. Dog API (Случайные фото собак)

**GET запрос - случайное фото**
- URL: `https://dog.ceo/api/breeds/image/random`
- Метод: GET
- Заголовки: `{}`

## API с аутентификацией

### 6. GitHub API

**GET запрос - информация о пользователе**
- URL: `https://api.github.com/users/octocat`
- Метод: GET
- Заголовки: `{}`

**GET запрос - ваш профиль (требует токен)**
- URL: `https://api.github.com/user`
- Метод: GET
- Заголовки:
```json
{
  "Authorization": "Bearer YOUR_GITHUB_TOKEN"
}
```

Как получить токен:
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Выберите нужные права доступа
4. Скопируйте токен

### 7. OpenWeatherMap (Погода)

**GET запрос - текущая погода**
- URL: `https://api.openweathermap.org/data/2.5/weather?q=Moscow&appid=YOUR_API_KEY&units=metric`
- Метод: GET
- Заголовки: `{}`

Как получить API ключ:
1. Зарегистрируйтесь на openweathermap.org
2. API keys → Create key
3. Используйте ключ в параметре `appid`

### 8. News API (Новости)

**GET запрос - последние новости**
- URL: `https://newsapi.org/v2/top-headlines?country=us&apiKey=YOUR_API_KEY`
- Метод: GET
- Заголовки: `{}`

Как получить API ключ:
1. Зарегистрируйтесь на newsapi.org
2. Скопируйте API ключ из личного кабинета

## Примеры с различными методами

### PUT запрос

**JSONPlaceholder - обновить пост**
- URL: `https://jsonplaceholder.typicode.com/posts/1`
- Метод: PUT
- Заголовки: `{}`
- Тело:
```json
{
  "id": 1,
  "title": "Обновленный заголовок",
  "body": "Обновленное содержимое",
  "userId": 1
}
```

### PATCH запрос

**JSONPlaceholder - частично обновить пост**
- URL: `https://jsonplaceholder.typicode.com/posts/1`
- Метод: PATCH
- Заголовки: `{}`
- Тело:
```json
{
  "title": "Новый заголовок"
}
```

### DELETE запрос

**JSONPlaceholder - удалить пост**
- URL: `https://jsonplaceholder.typicode.com/posts/1`
- Метод: DELETE
- Заголовки: `{}`

## Примеры с заголовками

### С Content-Type

- URL: `https://jsonplaceholder.typicode.com/posts`
- Метод: POST
- Заголовки:
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```
- Тело:
```json
{
  "title": "Test",
  "body": "Content",
  "userId": 1
}
```

### С пользовательскими заголовками

- URL: `https://httpbin.org/headers`
- Метод: GET
- Заголовки:
```json
{
  "X-Custom-Header": "MyValue",
  "User-Agent": "APIfy/1.0"
}
```

## Полезные тестовые API

### HTTPBin (Тестирование HTTP запросов)

**Эхо запроса**
- URL: `https://httpbin.org/anything`
- Метод: любой
- Возвращает все данные запроса

**Задержка ответа**
- URL: `https://httpbin.org/delay/2`
- Метод: GET
- Ответ придет через 2 секунды

**Статус код**
- URL: `https://httpbin.org/status/404`
- Метод: GET
- Вернет указанный статус код

### Mocky (Создание mock API)

Можно создать свои mock endpoints на mocky.io

## Советы по тестированию

1. Начните с простых GET запросов без аутентификации
2. Проверьте время отклика различных API
3. Тестируйте различные HTTP методы
4. Попробуйте API с аутентификацией
5. Проверьте обработку ошибок (несуществующие endpoints)
6. Сравните производительность разных API

## Ограничения

Многие публичные API имеют ограничения:
- Лимит запросов в минуту/час/день
- Требуют регистрацию для получения API ключа
- Могут блокировать запросы из браузера (CORS)

Для тестирования рекомендуется использовать JSONPlaceholder и HTTPBin - они не имеют ограничений и специально созданы для тестирования.
