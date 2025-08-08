# Home App

This project converts a static dashboard into a full-stack web application using React, Node.js, and MongoDB.

## Development

1. Install [Docker](https://www.docker.com/).
2. The included `.env` file disables BuildKit so `docker-compose` works with older releases.
3. Run the app:
   ```bash
   docker-compose up --build
   ```
   If you previously built the images with BuildKit and see a `KeyError: 'ContainerConfig'`, execute the helper script to reset
   the containers and images:
   ```bash
   ./scripts/reset-containers.sh
   ```
4. The React client runs on [http://localhost:3000](http://localhost:3000) and the API server on [http://localhost:5000](http://localhost:5000).

### Authentication

Use the **Register** link on the login screen to create a user, then sign in with those credentials. A JWT is stored in `localStorage` and appended to requests for protected resources. Use the **Logout** button on the dashboard to clear the token.

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
