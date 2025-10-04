import React, { useState, useEffect } from 'react'
import { migrateEnvironmentalActivities, createAdminUser, checkMigrationStatus } from '../../utils/dataMigration'

export const MigrationPage: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<{
    hasActivities: boolean
    hasPrograms: boolean
    hasUserProfiles: boolean
    needsDataMigration: boolean
    needsSchemaMigration: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    fullName: ''
  })
  const [creatingAdmin, setCreatingAdmin] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setLoading(true)
    try {
      const status = await checkMigrationStatus()
      setMigrationStatus(status)
    } catch (error) {
      console.error('Error checking migration status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMigration = async () => {
    setMigrating(true)
    setMigrationResult(null)
    
    try {
      const result = await migrateEnvironmentalActivities()
      setMigrationResult({
        success: result.success,
        message: result.success 
          ? `Migration completed! Created ${result.activitiesCount} activities and 1 program.`
          : `Migration failed: ${result.error}`
      })
      
      if (result.success) {
        // Refresh status
        await checkStatus()
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setMigrating(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingAdmin(true)
    
    try {
      const result = await createAdminUser(adminForm.email, adminForm.password, adminForm.fullName)
      if (result.success) {
        alert('Admin user created successfully! You can now log in with these credentials.')
        setAdminForm({ email: '', password: '', fullName: '' })
      } else {
        alert(`Failed to create admin user: ${result.error}`)
      }
    } catch (error) {
      alert(`Error creating admin user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreatingAdmin(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking migration status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Migration</h1>
          
          {/* Migration Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border-2 ${
                migrationStatus?.hasUserProfiles ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <h3 className="font-medium text-gray-900">Database Schema</h3>
                <p className={`text-sm ${migrationStatus?.hasUserProfiles ? 'text-green-700' : 'text-red-700'}`}>
                  {migrationStatus?.hasUserProfiles ? '✓ Present' : '✗ Missing'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {migrationStatus?.needsSchemaMigration ? 'Run migration 002 first' : 'Schema is ready'}
                </p>
              </div>
              <div className={`p-4 rounded-lg border-2 ${
                migrationStatus?.hasActivities ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <h3 className="font-medium text-gray-900">Activities</h3>
                <p className={`text-sm ${migrationStatus?.hasActivities ? 'text-green-700' : 'text-red-700'}`}>
                  {migrationStatus?.hasActivities ? '✓ Present' : '✗ Missing'}
                </p>
              </div>
              <div className={`p-4 rounded-lg border-2 ${
                migrationStatus?.hasPrograms ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <h3 className="font-medium text-gray-900">Programs</h3>
                <p className={`text-sm ${migrationStatus?.hasPrograms ? 'text-green-700' : 'text-red-700'}`}>
                  {migrationStatus?.hasPrograms ? '✓ Present' : '✗ Missing'}
                </p>
              </div>
            </div>
          </div>

          {/* Schema Migration Notice */}
          {migrationStatus?.needsSchemaMigration && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">Schema Migration Required</h2>
              <p className="text-yellow-700 mb-4">
                You need to run the database schema migration first. Go to your Supabase dashboard and run the migration files in order:
              </p>
              <ol className="list-decimal list-inside text-yellow-700 space-y-1 mb-4">
                <li>Run <code className="bg-yellow-100 px-1 rounded">migrations/001_initial_setup.sql</code></li>
                <li>Run <code className="bg-yellow-100 px-1 rounded">migrations/002_environmental_activities_system.sql</code></li>
              </ol>
              <p className="text-sm text-yellow-600">
                After running the schema migrations, refresh this page to continue with data migration.
              </p>
            </div>
          )}

          {/* Data Migration Actions */}
          {migrationStatus?.needsDataMigration && !migrationStatus?.needsSchemaMigration && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Run Data Migration</h2>
              <p className="text-gray-600 mb-4">
                This will migrate the existing environmental activities from JSON to the new database structure.
              </p>
              <button
                onClick={handleMigration}
                disabled={migrating}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {migrating ? 'Migrating...' : 'Run Data Migration'}
              </button>
            </div>
          )}

          {/* All Good Message */}
          {!migrationStatus?.needsDataMigration && !migrationStatus?.needsSchemaMigration && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-2">✅ All Set!</h2>
              <p className="text-green-700">
                Your database is fully migrated and ready to use. You can now access the admin panel at <code className="bg-green-100 px-1 rounded">/admin</code>.
              </p>
            </div>
          )}

          {/* Migration Result */}
          {migrationResult && (
            <div className={`mb-8 p-4 rounded-lg ${
              migrationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-medium ${
                migrationResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {migrationResult.message}
              </p>
            </div>
          )}

          {/* Admin User Creation */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Admin User</h2>
            <p className="text-gray-600 mb-4">
              Create an admin user account to access the admin dashboard.
            </p>
            
            <form onSubmit={handleCreateAdmin} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  minLength={6}
                />
              </div>
              
              <button
                type="submit"
                disabled={creatingAdmin}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {creatingAdmin ? 'Creating...' : 'Create Admin User'}
              </button>
            </form>
          </div>

          {/* Refresh Button */}
          <div className="mt-8 pt-8 border-t">
            <button
              onClick={checkStatus}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
