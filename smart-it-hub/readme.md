# Smart IT Hub

Smart IT Hub is a Node.js + Express backend for the Smart IT project. It provides authentication, course and student management APIs, serves the front-end pages from sibling project folders, and handles uploads and protected page access.

## Project Overview

This backend is located in the `smart-it-hub` directory and powers the main application flow by:

- Serving static front-end apps from the sibling directories in the repository root.
- Exposing REST API routes for authentication and business logic.
- Protecting sensitive pages and routes with session-based middleware.
- Connecting to a MySQL database using environment variables.
- Handling upload files under `/uploads`.

## Tech Stack

- Node.js
- Express.js
- MySQL (mysql2)
- Express Session
- bcryptjs
- dotenv
- Multer
- Nodemon (development)

## Project Structure

```text
smart-it-hub/
├── config/
│   └── db.js
├── controllers/
├── middlewares/
├── routes/
│   ├── auth.routes.js
│   ├── course.routes.js
│   ├── index.js
│   └── ...
├── scripts/
│   └── hash-passwords.js
├── utils/
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── uploads/
```

## Prerequisites

Before running the project, make sure you have:

- Node.js installed
- MySQL database server running
- Access to the repository's sibling front-end folders (for example `landpage`, `loginform`, `studentinfo`, etc.)

## Installation

1. Open the project directory:

```bash
cd smart-it-hub
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment example file:

```bash
cp .env.example .env
```

4. Update the `.env` file with your local configuration:

```env
PORT=3000
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
SESSION_SECRET=replace-with-a-long-random-secret
```

## Running the Project

Start the server in development mode:

```bash
npm run dev
```

Start the server in production mode:

```bash
npm start
```

The application starts on port `3000` by default unless a different `PORT` is provided.

## Available Scripts

```bash
npm start       # run the server
npm run dev     # run with nodemon for development
npm run hash-passwords  # hash stored passwords using the script in scripts/
```

## API and Front-End Behavior

The server configures the following:

- `app.use("/api", apiRoutes)` for backend API endpoints.
- Static serving for front-end pages like `landpage` and `loginform`.
- Protected access for most application pages through page authentication middleware.
- File uploads served from `/uploads` with restricted access.

## Notes

- The app requires `SESSION_SECRET` to be defined.
- The project loads database connection settings from environment variables via `dotenv`.
- Some routes and pages are protected using `requireAuth` and `requirePageAuth` middleware.

## License

This project is distributed without a license file in the repository snapshot provided here. Please check the repository owner or project documentation for licensing details.
