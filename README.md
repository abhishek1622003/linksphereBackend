# LinkSphere Server

This is the server-side API for LinkSphere, a professional networking platform.

## Deployment

### Vercel Deployment

1. **Prepare Database**
   - Create a PostgreSQL database (recommended: Neon, Supabase, or Vercel Postgres)
   - Note down the connection string

2. **Setup Firebase Admin**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Download the JSON file and extract the required fields

3. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub account
   - Import this project
   - Set the root directory to `server`

4. **Environment Variables**
   Set these environment variables in Vercel dashboard:
   
   ```
   DATABASE_URL=postgresql://username:password@hostname:5432/database
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_ADMIN_PROJECT_ID=your-project-id
   NODE_ENV=production
   ```

5. **Database Migration**
   After deployment, run database migrations:
   ```bash
   npm run db:push
   ```

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your database and Firebase admin configuration.

3. **Setup database:**
   ```bash
   npm run db:push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get specific post
- `POST /api/posts/:id/like` - Like/unlike post

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile

## Tech Stack

- Node.js
- Express.js
- TypeScript
- Drizzle ORM
- PostgreSQL
- Firebase Admin SDK
- Zod for validation

## Database Schema

The application uses the following main tables:
- `users` - User profiles and authentication data
- `posts` - User posts and content
- `likes` - Post likes
- `comments` - Post comments (planned)
- `follows` - User follow relationships (planned)
