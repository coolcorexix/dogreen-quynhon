# Database Migrations

This folder contains database migration files for the DoGreen environmental activities platform.

## Migration Files

### 001_initial_setup.sql
- **Purpose**: Initial database setup with basic user checklist progress tracking
- **Tables Created**: 
  - `user_checklist_progress` - Original 30-day checklist functionality
- **Features**: Basic user progress tracking for environmental activities

### 002_environmental_activities_system.sql
- **Purpose**: Complete environmental activities management system with admin controls
- **Tables Created**:
  - `user_profiles` - User information with role-based access
  - `activities` - Environmental activities with scoring and rewards
  - `programs` - Activity programs with duration and management
  - `program_activities` - Links activities to programs with ordering
  - `user_program_enrollment` - User enrollments in programs
  - `user_activity_completion` - User activity completion tracking
- **Features**: 
  - Admin-controlled activity and program management
  - User progress tracking with verification
  - Role-based access control
  - Automatic scoring and leveling system

## Running Migrations

### Manual Execution (Recommended)
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run migrations in order:
   - First run `001_initial_setup.sql`
   - Then run `002_environmental_activities_system.sql`

### Migration Order
Always run migrations in numerical order:
1. `001_initial_setup.sql` - Must be run first
2. `002_environmental_activities_system.sql` - Depends on migration 001

## Migration Status

- ✅ **001_initial_setup.sql** - Ready to run
- ✅ **002_environmental_activities_system.sql** - Ready to run

## After Running Migrations

1. **Data Migration**: Use the migration page at `/admin/migration` to:
   - Migrate existing JSON activities to the database
   - Create your first admin user

2. **Admin Access**: 
   - Log in with your admin account
   - Access the admin panel at `/admin`

## Rollback

If you need to rollback migrations, you can drop the tables in reverse order:
1. Drop tables from migration 002
2. Drop tables from migration 001

**Warning**: This will delete all data!

## Troubleshooting

### Common Issues
- **RLS Policies**: Make sure Row Level Security policies are created correctly
- **Triggers**: Verify that triggers are working for user profile creation
- **Indexes**: Check that performance indexes are created

### Verification
After running migrations, verify:
1. All tables exist
2. RLS policies are active
3. Triggers are working
4. Admin user can be created
5. Activities can be migrated from JSON

## Development

When adding new migrations:
1. Use sequential numbering: `003_description.sql`
2. Include proper documentation
3. Test migrations on a development database first
4. Update this README with migration details
