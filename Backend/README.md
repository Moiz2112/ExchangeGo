# ExchangeGO Backend

Backend service for the ExchangeGO cryptocurrency tracking platform.

## Prerequisites

- Docker
- Docker Compose
- Go 1.23 or newer for local development
- Node.js and npm if you also plan to run the frontend

## Run the Backend

1. Open a terminal in the backend folder:

```bash
cd ExchangeGO/Backend
```

2. Start the services with Docker:

```bash
docker-compose up --build
```

This starts:

- PostgreSQL on `localhost:5433`
- RabbitMQ on `localhost:5672`
- RabbitMQ management UI on `http://localhost:15672`
- Backend API on `http://localhost:8081`

## Environment Notes

The backend reads configuration from environment variables. `docker-compose.yml`
already provides the database and RabbitMQ connection values.

If you use the chatbot features, make sure these are available:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Run the Frontend

From the project root:

```bash
cd Frontend
npm install
npm run dev
```

The frontend development server runs on `http://localhost:5173`.

## Project Structure

```text
ExchangeGO/
|-- Backend/
|-- Frontend/
`-- README.md
```

## Notes

- Start the backend before opening the frontend.
- The current frontend code expects the backend on port `8081`.
- Keep secrets in local environment files and do not commit them.
