# Home App

This project converts a static dashboard into a full-stack web application using React, Node.js, and MongoDB.

## Development

1. Install [Docker](https://www.docker.com/).
2. Run the app:
   ```bash
   docker-compose up --build
   ```
3. The React client runs on [http://localhost:3000](http://localhost:3000) and the API server on [http://localhost:5000](http://localhost:5000).

## Structure

- `client` – React frontend that loads the dashboard.
- `server` – Express API with MongoDB using Mongoose.
- `docker-compose.yml` – Runs client, server, and MongoDB containers.

## Testing

Run tests for client and server:
```bash
cd client && npm test
cd ../server && npm test
```
