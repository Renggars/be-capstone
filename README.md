# MindBalance Backend

MindBalance is a mental health application backend built with Node.js, Express, and Prisma. This project provides a robust API for managing user profiles, daily check-ins, community groups, and dashboard insights.

## Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (>= 22.0.0)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MySQL](https://www.mysql.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Caching**: [Redis](https://redis.io/) (Optional)
- **Auth**: [Passport.js](https://www.passportjs.org/) (JWT Strategy)
- **Documentation**: [Swagger UI](https://swagger.io/tools/swagger-ui/)
- **Validation**: [Joi](https://joi.dev/)
- **Testing**: [Jest](https://jestjs.io/) & [Supertest](https://github.com/ladjs/supertest)

## Features

- **Authentication**: Secure registration and login using JWT.
- **User Management**: Profile updates and avatar uploads (Multer).
- **Daily Check-ins**: Track mental health status with timezone-sensitive data.
- **Dashboard**: Aggregated insights and daily trends.
- **Community**: Manage groups and interactions.
- **Security**: Implementation of Helmet, XSS protection, and Rate Limiting.
- **Logging**: Comprehensive logging with Winston and Morgan.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (Version 22 or higher)
- [MySQL](https://www.mysql.com/downloads/)
- [Redis](https://redis.io/download/) (Optional, can be disabled in config)
  Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the `.env.example` file to `.env` and update the variables accordingly.

```bash
cp .env.example .env
```

Key configurations:

- `DATABASE_URL`: Connection string for MySQL.
- `JWT_SECRET`: Secret key for token signing.
- `REDIS_ENABLED`: Set to `true` if using Redis for caching.

### 4. Database Setup (Prisma)

Generate the Prisma client and run migrations.

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed initial data (optional)
npx prisma db seed
```

### 5. Running the Application

**Development Mode:**

```bash
npm run dev
```

**Production Mode:**

```bash
npm run build
npm start
```

## API Documentation

Once the server is running, you can access the interactive Swagger documentation at:
`http://localhost:4000/api-docs`
