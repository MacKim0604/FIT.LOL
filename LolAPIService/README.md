# LolAPIService

A minimal Node.js (TypeScript) service with Controller/DTO/Service structure.

## Run locally

1. Install dependencies
```
npm install
```

2. Start dev server
```
npm run dev
```

Server will listen on http://localhost:3001

## Endpoints

- GET `/health` -> `{ status: "ok" }`
- GET `/api/hello` -> `{ message: "Hello World from LolAPIService" }`
