# Sneaker shop

## client

### Set up

- `cd client`
- `npm install` to install all dependencies
- `npm start`

## migration
Before running the server, make sure you have the following things set up::
- MSSQL server
- in .env file set DATABASE_URL=`sqlserver://localhost:1433;database={YOUR_DATABASE};user={USER};password={YOUR_PASSWORD};TrustServerCertificate=true`

How to run:
- `cd migration`
- `npm install` to install all dependencies
- `npx prisma db push` to sync database
- `npx prisma generate` to apply changes to prismaClient
- `npx prisma db seed` to seed database
- `npm start` 