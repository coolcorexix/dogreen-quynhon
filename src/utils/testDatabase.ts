import { supabase } from '../lib/supabase'

export const testDatabaseConnection = async () => {
  console.log('🔍 Testing database connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Database connection successful')
    return { success: true }
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const testTableStructure = async () => {
  console.log('🔍 Testing table structure...')
  
  const tables = [
    'user_profiles',
    'activities', 
    'programs',
    'program_activities',
    'user_program_enrollment',
    'user_activity_completion'
  ]
  
  const results = []
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.error(`❌ Table ${table} not accessible:`, error.message)
        results.push({ table, exists: false, error: error.message })
      } else {
        console.log(`✅ Table ${table} exists and accessible`)
        results.push({ table, exists: true })
      }
    } catch (error) {
      console.error(`❌ Error testing table ${table}:`, error)
      results.push({ table, exists: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
  
  return results
}

export const testRLSPolicies = async () => {
  console.log('🔍 Testing RLS policies...')
  
  try {
    // Test if we can read activities (should be public)
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id')
      .limit(1)
    
    if (activitiesError) {
      console.error('❌ Activities RLS test failed:', activitiesError.message)
      return { success: false, error: activitiesError.message }
    }
    
    console.log('✅ RLS policies working correctly')
    return { success: true }
  } catch (error) {
    console.error('❌ RLS test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const runFullDatabaseTest = async () => {
  console.log('🚀 Running full database test...')
  
  const connectionTest = await testDatabaseConnection()
  if (!connectionTest.success) {
    return { success: false, step: 'connection', error: connectionTest.error }
  }
  
  const structureTest = await testTableStructure()
  const missingTables = structureTest.filter(t => !t.exists)
  
  if (missingTables.length > 0) {
    console.error('❌ Missing tables:', missingTables.map(t => t.table).join(', '))
    return { 
      success: false, 
      step: 'structure', 
      missingTables: missingTables.map(t => t.table),
      errors: missingTables.map(t => t.error)
    }
  }
  
  const rlsTest = await testRLSPolicies()
  if (!rlsTest.success) {
    return { success: false, step: 'rls', error: rlsTest.error }
  }
  
  console.log('✅ All database tests passed!')
  return { success: true }
}
