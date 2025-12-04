# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/15491717-8092-474b-97d8-d03c122a0f54

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/15491717-8092-474b-97d8-d03c122a0f54) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/15491717-8092-474b-97d8-d03c122a0f54) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Authentication (PostgreSQL, JWT)

This project now includes a backend server providing authentication with PostgreSQL, bcrypt password hashing, and JWT in HttpOnly cookies.

### Database schema

SQL migration at `server/migrations/001_init.sql` creates the `users` table:

- id: UUID primary key
- username: unique text
- email: unique text
- password_hash: text (bcrypt)
- role: 'user' | 'admin'
- created_at: timestamp

### Environment variables

- Frontend: `.env` at repository root
```
VITE_API_URL=http://localhost:5000
```
- Server: `server/.env`
```
PORT=5000
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
# Optional: CORS origin (defaults to http://localhost:8081)
CORS_ORIGIN=http://localhost:8081
```

### Install and run

1. Start PostgreSQL and create a database.
2. Configure `server/.env` with your `DATABASE_URL` and `JWT_SECRET`.
3. Run server migrations and start the server:
```
cd server
npm install
npm run migrate
npm run dev
```
4. In a new terminal, run the frontend:
```
npm install
npm run dev
```
The frontend will be at `http://localhost:8081` (or 8080) and the server at `http://localhost:5000`.

### Create an admin user (direct DB)

Admins should be added directly in the DB. Generate a bcrypt hash and insert:

Generate hash in Node:
```
node -e "require('bcrypt').hash('YourAdminPassword', 10).then(h=>console.log(h))"
```
Then insert:
```
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@example.com', '<PASTE_BCRYPT_HASH>', 'admin');
```

### API endpoints

- POST `/api/signup` { username, email, password } → create user, set cookie
- POST `/api/login` { usernameOrEmail, password } → login, set cookie
- POST `/api/logout` → clear cookie
- GET `/api/me` → current user
- GET `/api/admin/ping` → admin only
- GET `/api/user/ping` → user only

### Route protection

- All existing app pages require authentication and user role (`user`).
- Admin-only page at `/admin-dashboard`.
- Login at `/login`, Signup at `/signup`, Logout at `/logout`.

No MongoDB code remains; PostgreSQL is used via `pg`.
