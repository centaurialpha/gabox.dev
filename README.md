# gabox

Portfolio estático: `public/` se sirve tal cual con nginx.

## Local

```sh
python3 -m http.server -d public 8080
```

## Deploy

```sh
docker compose up -d --build
```
