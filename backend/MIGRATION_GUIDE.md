# MongoDB to Supabase Migration Guide

This guide will help you migrate your Devs Society Portal from MongoDB to Supabase (PostgreSQL).

## 🎯 Overview

The migration involves:
- Replacing MongoDB with Supabase (PostgreSQL)
- Converting Mongoose models to Supabase services
- Migrating existing data from MongoDB to Supabase
- Updating all API routes to use the new services

## 📋 Prerequisites

Before starting the migration, ensure you have:

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project in your Supabase dashboard
3. **MongoDB Access**: Existing MongoDB database with data to migrate
4. **Node.js Environment**: Ensure your development environment is ready

## 🗄️ Step 1: Setup Supabase Project

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `devs-society-portal`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose the closest to your users
5. Wait for the project to be created (takes 1-2 minutes)

### 1.2 Get Your Credentials
1. Go to Settings → API in your Supabase dashboard
2. Copy the following values:
   - **Project URL**
   - **anon/public key**

### 1.3 Configure Environment Variables
1. Copy `supabase.env.example` to `.env`:
   ```bash
   cp supabase.env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here

   # JWT Secret
   JWT_SECRET=your_super_secret_jwt_key_here

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173
   ```

## 🏗️ Step 2: Create Database Schema

### 2.1 Run the Schema Migration
1. Go to SQL Editor in your Supabase dashboard
2. Copy the contents of `src/database/schemas/001_initial_schema.sql`
3. Paste and execute the SQL script
4. This will create all tables, indexes, triggers, and functions

### 2.2 Verify Schema Creation
Check that the following tables were created:
- `colleges`
- `admins`
- `users`
- `events`
- `event_registrations`
- `college_tenure_heads`

## 🔄 Step 3: Data Migration

### 3.1 Prepare for Migration
1. Ensure your MongoDB database is accessible
2. Update `MONGODB_URI` in your `.env` file if needed
3. Install dependencies: `npm install`

### 3.2 Run Data Migration
```bash
# Install mongoose temporarily for migration
npm install mongoose

# Run the migration script
npx ts-node src/scripts/migrateToSupabase.ts
```

The migration script will:
- Connect to both MongoDB and Supabase
- Migrate data in the correct order (colleges → admins → users → events)
- Preserve relationships between entities
- Show progress and statistics
- Handle errors gracefully

### 3.3 Verify Migration
After migration, check your Supabase dashboard to ensure:
- All records were migrated successfully
- Relationships are maintained
- No critical errors occurred

## 🚀 Step 4: Update Application Code

### 4.1 Dependencies
The following changes have been made to dependencies:
- ✅ **Added**: `@supabase/supabase-js`
- ❌ **Removed**: `mongoose`

### 4.2 Code Changes
All MongoDB-specific code has been replaced:

#### Database Connection
- **Before**: MongoDB connection in `src/index.ts`
- **After**: Supabase client initialization

#### Models → Services
- **Before**: Mongoose models (`src/models/`)
- **After**: Service classes (`src/services/`)

#### API Routes
- **Before**: Direct Mongoose model usage
- **After**: Service method calls

### 4.3 Key Changes Summary

| Component | MongoDB (Before) | Supabase (After) |
|-----------|------------------|------------------|
| **Database** | MongoDB | PostgreSQL via Supabase |
| **ORM/Client** | Mongoose | Supabase Client |
| **Schema** | Mongoose Schemas | SQL Tables |
| **Queries** | Mongoose methods | Supabase queries |
| **Relationships** | ObjectId references | UUID foreign keys |
| **Validation** | Mongoose validators | Database constraints |
| **Hooks** | Mongoose middleware | PostgreSQL triggers |

## 🧪 Step 5: Testing

### 5.1 Start the Server
```bash
npm run dev
```

### 5.2 Test Core Functionality
Test the following endpoints to ensure everything works:

#### Authentication
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "college": "Test College",
    "batchYear": "2024",
    "role": "core-member"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

#### Health Check
```bash
curl http://localhost:5000/api/health
```

### 5.3 Frontend Testing
1. Start the frontend: `cd ../frontend && npm run dev`
2. Test login/registration functionality
3. Verify data appears correctly
4. Test all CRUD operations

## 🔧 Step 6: Production Deployment

### 6.1 Environment Variables
Ensure your production environment has:
```env
SUPABASE_URL=your-production-supabase-url
SUPABASE_ANON_KEY=your-production-anon-key
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
```

### 6.2 Database Considerations
- Enable Row Level Security (RLS) if needed
- Set up database backups
- Configure monitoring and alerts
- Review and optimize indexes

## 🎛️ Step 7: Optional Optimizations

### 7.1 Row Level Security (RLS)
Add RLS policies for enhanced security:
```sql
-- Example: Users can only access their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id::text);
```

### 7.2 Database Functions
Create custom PostgreSQL functions for complex operations:
```sql
-- Example: Get user statistics
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE(
  total_users bigint,
  active_users bigint,
  users_by_role jsonb
) AS $$
BEGIN
  -- Function implementation
END;
$$ LANGUAGE plpgsql;
```

### 7.3 Indexes and Performance
Monitor query performance and add indexes as needed:
```sql
-- Example: Add composite index for frequent queries
CREATE INDEX idx_users_college_batch ON users(college_ref_id, batch_year)
WHERE is_active = true;
```

## 🆘 Troubleshooting

### Common Issues

#### 1. Connection Errors
**Error**: "Missing Supabase environment variables"
**Solution**: Verify `.env` file has correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`

#### 2. Migration Failures
**Error**: Foreign key constraint violations
**Solution**: Ensure migration runs in correct order (colleges → admins → users → events)

#### 3. Authentication Issues
**Error**: JWT token verification fails
**Solution**: Check that `JWT_SECRET` is set correctly

#### 4. Performance Issues
**Error**: Slow queries
**Solution**: Add appropriate indexes and optimize query patterns

### Getting Help

1. **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
2. **Supabase Community**: [discord.gg/supabase](https://discord.gg/supabase)
3. **PostgreSQL Documentation**: [postgresql.org/docs](https://postgresql.org/docs)

## ✅ Migration Checklist

- [ ] Supabase project created and configured
- [ ] Environment variables set up
- [ ] Database schema created
- [ ] Data migrated successfully
- [ ] Application code updated
- [ ] All tests passing
- [ ] Frontend functionality verified
- [ ] Production deployment configured
- [ ] Monitoring and backups set up

## 🎉 Conclusion

Congratulations! You have successfully migrated from MongoDB to Supabase. Your application now benefits from:

- **PostgreSQL**: A robust, SQL-compliant database
- **Real-time subscriptions**: Built-in real-time functionality
- **Authentication**: Integrated auth system (if you choose to use it)
- **Storage**: Built-in file storage
- **Dashboard**: Powerful admin interface
- **APIs**: Auto-generated REST and GraphQL APIs
- **Performance**: Optimized queries and caching

Your Devs Society Portal is now running on a modern, scalable infrastructure! 