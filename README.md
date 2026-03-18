# Corgi

High-resolution image viewer powered by [OpenSeaDragon](https://openseadragon.github.io/).

Built with Vite, React 19, TypeScript, and Material UI.

## Quick Start

```bash
docker compose up --build
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

Source files in `frontend/src/` are bind-mounted into the container, so edits are reflected immediately via Vite HMR.

## Development Without Docker

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
frontend/          React + Vite application
  src/             Source code
  Dockerfile       Dev container image
archive/           Legacy Laravel/Vue codebase (preserved for reference)
docker-compose.yml Docker Compose dev environment
```

