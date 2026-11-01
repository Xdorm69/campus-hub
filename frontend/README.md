# CampusHub — frontend

Next.js 16 app for CampusHub. Setup, features and architecture are documented at the repository root:

- [Project README](../README.md): quick start and scripts
- [Architecture](../docs/architecture.md): folder layout and data flow
- [Real-time chat](../docs/realtime-chat.md): how polling and infinite scroll work
- [Configuration](../docs/configuration.md): `NEXT_PUBLIC_API_URL` and limits

```bash
cp .env.example .env   # NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
pnpm install
pnpm dev               # http://localhost:3000
```
