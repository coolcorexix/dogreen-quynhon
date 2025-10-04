import { supabase } from '../lib/supabase'
import environmentalActivities from '../data/environmentalActivities.json'

interface LegacyActivity {
  day: number
  activityName: string
  isCheckpointForGift: boolean
}

export const migrateEnvironmentalActivities = async () => {
  try {
    console.log('Starting migration of environmental activities...')

    // First, create activities from the JSON data
    const activities = environmentalActivities.map((activity: LegacyActivity) => ({
      title: activity.activityName,
      description: `Complete this environmental activity as part of the 30-day challenge. ${activity.isCheckpointForGift ? 'This is a checkpoint activity that earns you a special reward!' : ''}`,
      is_checkpoint: activity.isCheckpointForGift,
      reward: activity.isCheckpointForGift ? 'Eco-friendly gift (to be determined by admin)' : null,
      score: activity.isCheckpointForGift ? 10 : 5 // Checkpoint activities give more points
    }))

    // Insert activities into the database
    const { data: insertedActivities, error: activitiesError } = await supabase
      .from('activities')
      .insert(activities)
      .select()

    if (activitiesError) {
      throw new Error(`Error inserting activities: ${activitiesError.message}`)
    }

    console.log(`Successfully inserted ${insertedActivities?.length || 0} activities`)

    // Get the current user (admin who is running the migration)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated to run migration')
    }

    // Create a default 30-day program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .insert([{
        name: '30-Day Environmental Challenge',
        description: 'A comprehensive 30-day program to build sustainable habits and make a positive impact on the environment. Each day features a different activity designed to reduce your environmental footprint.',
        duration_days: 30,
        is_active: true,
        created_by: user.id
      }])
      .select()
      .single()

    if (programError) {
      throw new Error(`Error creating program: ${programError.message}`)
    }

    console.log('Successfully created default program')

    // Create program activities linking each activity to the program
    if (insertedActivities && program) {
      const programActivities = insertedActivities.map((activity, index) => ({
        program_id: program.id,
        activity_id: activity.id,
        day_order: index + 1
      }))

      const { error: programActivitiesError } = await supabase
        .from('program_activities')
        .insert(programActivities)

      if (programActivitiesError) {
        throw new Error(`Error creating program activities: ${programActivitiesError.message}`)
      }

      console.log(`Successfully linked ${programActivities.length} activities to the program`)
    }

    console.log('Migration completed successfully!')
    return {
      success: true,
      activitiesCount: insertedActivities?.length || 0,
      programId: program?.id
    }

  } catch (error) {
    console.error('Migration failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Function to create an admin user (for testing purposes)
export const createAdminUser = async (email: string, password: string, fullName: string) => {
  try {
    // First, sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`)
    }

    if (authData.user) {
      // Update the user profile to be an admin
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('user_id', authData.user.id)

      if (profileError) {
        throw new Error(`Profile update error: ${profileError.message}`)
      }

      console.log('Admin user created successfully!')
      return { success: true, userId: authData.user.id }
    }

    return { success: false, error: 'No user created' }

  } catch (error) {
    console.error('Error creating admin user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Function to check if migration is needed
export const checkMigrationStatus = async () => {
  try {
    // Check if the new system tables exist and have data
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id')
      .limit(1)

    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id')
      .limit(1)

    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)

    return {
      hasActivities: !activitiesError && activities && activities.length > 0,
      hasPrograms: !programsError && programs && programs.length > 0,
      hasUserProfiles: !profilesError && userProfiles && userProfiles.length > 0,
      needsDataMigration: (activitiesError || !activities || activities.length === 0) || 
                         (programsError || !programs || programs.length === 0),
      needsSchemaMigration: profilesError !== null // If user_profiles doesn't exist, schema migration is needed
    }
  } catch (error) {
    console.error('Error checking migration status:', error)
    return {
      hasActivities: false,
      hasPrograms: false,
      hasUserProfiles: false,
      needsDataMigration: true,
      needsSchemaMigration: true
    }
  }
}
