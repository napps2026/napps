# NAPPS Ogun State Website

A modern web portal for the National Association of Proprietors of Private Schools (NAPPS) Ogun State Chapter, now integrated with Neon database.

## Setup Instructions

### 1. Database Setup
1. Create a Neon database at [neon.tech](https://neon.tech)
2. Run the SQL schema from `database-schema.sql` in your Neon database
3. Copy your database connection string

### 2. Environment Variables
Set the following environment variable in your Netlify dashboard:
- `DATABASE_URL`: Your Neon database connection string

### 3. Deployment
The site is configured for Netlify deployment with serverless functions.

## Features
- School directory with search functionality
- Database integration with Neon PostgreSQL
- Responsive design
- Serverless API functions

## Database Schema
The application expects a `schools` table with the following columns:
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `location` (VARCHAR)
- `image_url` (TEXT, optional)

## API Endpoint
- `/.netlify/functions/api` - Returns all schools as JSON