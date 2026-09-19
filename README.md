# HRMS Frontend

Angular frontend for the multi-tenant HRMS SaaS application.

## Stack

- Angular 18
- Tailwind CSS
- REST API integration with AdonisJS backend

## Local development

1. Install dependencies:

```bash
npm ci
```

2. Start the app:

```bash
npm start
```

3. Open [http://localhost:4200](http://localhost:4200)

The frontend expects the backend API at `http://localhost:3333/api` by default.

## Production build

```bash
npm run build
```

The current Angular build outputs to:

```text
dist/hrms-frontend/browser
```

This is the correct static publish directory for Netlify and Render static hosting.

## Runtime API configuration

The frontend reads runtime config from [public/app-config.js](d:/HRMS_FRONTEND/public/app-config.js).

Default behavior:

- `localhost` -> `http://localhost:3333/api`
- non-localhost -> `https://hrms-backend-r5ed.onrender.com/api`

You can override `window.__HRMS_CONFIG__.apiUrl` at deploy time if your backend URL changes.
