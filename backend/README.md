# Dulce Toxo Backend

Backend API for the Dulce Toxo pastry recipes application.

## Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: Turso (libSQL)
- **Authentication**: Better Auth
- **Image Storage**: Cloudinary

## Setup

1. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your environment variables in `.env`

3. Install dependencies:
   ```bash
   bun install
   ```

4. Run database migrations:
   ```bash
   bun run db:migrate
   ```

5. Start the development server:
   ```bash
   bun run dev
   ```

The server will start on `http://localhost:4000`.

## API Endpoints

### Authentication (Better Auth)
- `POST /api/auth/sign-up/email` - Register
- `POST /api/auth/sign-in/email` - Login
- `GET /api/auth/session` - Get current session

### Categories
- `GET /categories` - List all categories

### Recipes
- `GET /recipes` - List all recipes
- `GET /recipes/:id` - Get recipe by ID
- `POST /recipes` - Create recipe
- `PUT /recipes/:id` - Update recipe
- `DELETE /recipes/:id` - Delete recipe

### Uploads
- `POST /uploads` - Upload image to Cloudinary
- `DELETE /uploads/:publicId` - Delete image from Cloudinary

## Environment Variables

See `.env.example` for required environment variables.
