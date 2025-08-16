# Auth Setup (PostgreSQL + JWT + Express)

## 1) Configure environment

- Copy `server/.env.sample` to `server/.env` and fill in values
- Copy `.env.sample` to `.env` in repo root (for Vite `VITE_API_URL`)

## 2) Prepare database

- Ensure PostgreSQL is running and accessible by `DATABASE_URL`
- Run migrations:
```
cd server
npm install
npm run migrate
```

If `gen_random_uuid()` is not available, enable extension:
```
-- Connect to DB as superuser
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## 3) Start the server and frontend
```
cd server && npm run dev
# in another terminal
npm run dev
```

Server default: http://localhost:5000
Frontend default: http://localhost:8081

## 4) Create an admin user
Admins are added directly in DB.

Generate a bcrypt hash:
```
node -e "require('bcrypt').hash('YourAdminPassword', 10).then(h=>console.log(h))"
```
Insert user:
```
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@example.com', '<BCRYPT_HASH>', 'admin');
```

## 5) API quick test
```
# Health
curl http://localhost:5000/api/health

# Signup (user only)
curl -i -X POST http://localhost:5000/api/signup -H "Content-Type: application/json" \
  --data '{"username":"u1","email":"u1@example.com","password":"secret123"}'

# Login
curl -i -X POST http://localhost:5000/api/login -H "Content-Type: application/json" \
  --data '{"usernameOrEmail":"u1","password":"secret123"}'

# Me (send cookie from login response)
# Admin ping (admin only)
```

## 6) Frontend usage
- Visit `/login` to sign in; role determines redirect
- User pages require role `user`
- Admin page is at `/admin-dashboard`
- `/logout` clears session

## Notes
- Tokens are HttpOnly cookies with 7-day expiry
- CORS is enabled for development; configure `CORS_ORIGIN` in server `.env`
