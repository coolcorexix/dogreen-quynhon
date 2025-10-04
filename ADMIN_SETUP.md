# Admin Setup Guide

This guide will help you set up the new database structure and admin functionality for the environmental activities management system.

## Prerequisites

1. Make sure you have Supabase configured with your project
2. Ensure your environment variables are set up correctly

## Database Setup

### 1. Run the Database Schema Migrations

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the migration files in order:

**First Migration:**
- Copy and paste the contents of `migrations/001_initial_setup.sql`
- Execute the script

**Second Migration:**
- Copy and paste the contents of `migrations/002_environmental_activities_system.sql`
- Execute the script

This will create all the necessary tables:
- `user_checklist_progress` - Original 30-day checklist functionality
- `user_profiles` - User information with roles
- `activities` - Environmental activities
- `programs` - Activity programs
- `program_activities` - Links activities to programs with ordering
- `user_program_enrollment` - User enrollments in programs
- `user_activity_completion` - User activity completion tracking

### 2. Migrate Existing Data

1. Start your development server: `npm run dev`
2. Navigate to `/admin/migration` in your browser
3. The page will check your migration status and guide you through the process
4. Click "Run Data Migration" to migrate the existing JSON activities to the database
5. Create an admin user using the form on the migration page

## Admin Features

### Accessing the Admin Panel

1. Log in with your admin account
2. Navigate to `/admin` to access the admin dashboard

### Managing Activities

- **Create**: Add new environmental activities with title, description, score, and checkpoint status
- **Edit**: Modify existing activities
- **Delete**: Remove activities (be careful as this affects programs)
- **Checkpoint Activities**: Mark activities as checkpoints that give rewards

### Managing Programs

- **Create**: Create new programs with name, description, and duration
- **Add Activities**: Link activities to programs with specific day ordering
- **Edit**: Modify program details and activity ordering
- **Delete**: Remove programs (this will also remove program activities)

### User Progress Management

- **View Progress**: See all users enrolled in programs with their progress
- **Bulk Verification**: Select multiple users and verify their completion of specific activities
- **Progress Tracking**: Monitor completion rates, scores, and user levels

## Database Schema

### Activities Table
```sql
- id (UUID, Primary Key)
- title (TEXT) - Activity name
- description (TEXT) - Detailed description
- is_checkpoint (BOOLEAN) - Whether it's a checkpoint activity
- reward (TEXT) - Reward description for checkpoint activities
- score (INTEGER) - Points awarded for completion
- created_at, updated_at (TIMESTAMP)
```

### Programs Table
```sql
- id (UUID, Primary Key)
- name (TEXT) - Program name
- description (TEXT) - Program description
- duration_days (INTEGER) - Program duration in days
- is_active (BOOLEAN) - Whether program is active
- created_by (UUID) - Admin who created the program
- created_at, updated_at (TIMESTAMP)
```

### User Progress Tracking
- Users can enroll in programs
- Their activity completions are tracked
- Admins can verify completions manually
- User scores and levels are automatically calculated

## Security

- Row Level Security (RLS) is enabled on all tables
- Only admins can create, edit, or delete activities and programs
- Users can only view their own progress
- Admins can view all user data

## Troubleshooting

### Migration Issues
- Check that all tables were created successfully
- Verify RLS policies are in place
- Ensure the migration script ran without errors

### Admin Access Issues
- Make sure your user profile has `role = 'admin'`
- Check that you're logged in with the correct account
- Verify the user_profiles table has your user record

### Data Issues
- Check that activities were migrated correctly
- Verify program-activity relationships
- Ensure user enrollments are working

## Next Steps

1. Create your first program with activities
2. Test user enrollment and progress tracking
3. Set up your first admin user
4. Customize activities and programs for your needs

For any issues or questions, check the browser console for error messages and verify your Supabase configuration.
