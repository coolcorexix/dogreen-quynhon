import React, { useState } from 'react'
import { runFullDatabaseTest, testDatabaseConnection, testTableStructure, testRLSPolicies } from '../../utils/testDatabase'
import { checkMigrationStatus } from '../../utils/dataMigration'

export const TestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<any>(null)

  const runTests = async () => {
    setLoading(true)
    setTestResults(null)
    
    try {
      const results = await runFullDatabaseTest()
      setTestResults(results)
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const checkMigration = async () => {
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

  const runIndividualTests = async () => {
    setLoading(true)
    setTestResults(null)
    
    try {
      const connectionTest = await testDatabaseConnection()
      const structureTest = await testTableStructure()
      const rlsTest = await testRLSPolicies()
      
      setTestResults({
        connection: connectionTest,
        structure: structureTest,
        rls: rlsTest
      })
    } catch (error) {
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Test Suite</h1>
          
          {/* Test Buttons */}
          <div className="mb-8 space-x-4">
            <button
              onClick={runTests}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Running Tests...' : 'Run Full Test Suite'}
            </button>
            
            <button
              onClick={runIndividualTests}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Running Tests...' : 'Run Individual Tests'}
            </button>
            
            <button
              onClick={checkMigration}
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Checking...' : 'Check Migration Status'}
            </button>
          </div>

          {/* Migration Status */}
          {migrationStatus && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Migration Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border-2 ${
                  migrationStatus.hasUserProfiles ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <h3 className="font-medium text-gray-900">Schema</h3>
                  <p className={`text-sm ${migrationStatus.hasUserProfiles ? 'text-green-700' : 'text-red-700'}`}>
                    {migrationStatus.hasUserProfiles ? '✅ Ready' : '❌ Missing'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border-2 ${
                  migrationStatus.hasActivities ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <h3 className="font-medium text-gray-900">Activities</h3>
                  <p className={`text-sm ${migrationStatus.hasActivities ? 'text-green-700' : 'text-red-700'}`}>
                    {migrationStatus.hasActivities ? '✅ Ready' : '❌ Missing'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border-2 ${
                  migrationStatus.hasPrograms ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <h3 className="font-medium text-gray-900">Programs</h3>
                  <p className={`text-sm ${migrationStatus.hasPrograms ? 'text-green-700' : 'text-red-700'}`}>
                    {migrationStatus.hasPrograms ? '✅ Ready' : '❌ Missing'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Test Results */}
          {testResults && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
              
              {/* Full Test Results */}
              {testResults.success !== undefined && (
                <div className={`p-4 rounded-lg border-2 ${
                  testResults.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <h3 className="font-medium text-gray-900 mb-2">
                    {testResults.success ? '✅ All Tests Passed!' : '❌ Tests Failed'}
                  </h3>
                  {testResults.error && (
                    <p className="text-sm text-red-700">
                      Error: {testResults.error}
                    </p>
                  )}
                  {testResults.missingTables && (
                    <div>
                      <p className="text-sm text-red-700 mb-2">Missing tables:</p>
                      <ul className="list-disc list-inside text-sm text-red-700">
                        {testResults.missingTables.map((table: string) => (
                          <li key={table}>{table}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Individual Test Results */}
              {testResults.connection && (
                <div className={`p-4 rounded-lg border-2 ${
                  testResults.connection.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <h3 className="font-medium text-gray-900">Database Connection</h3>
                  <p className={`text-sm ${testResults.connection.success ? 'text-green-700' : 'text-red-700'}`}>
                    {testResults.connection.success ? '✅ Connected' : `❌ Failed: ${testResults.connection.error}`}
                  </p>
                </div>
              )}

              {testResults.structure && (
                <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                  <h3 className="font-medium text-gray-900 mb-2">Table Structure</h3>
                  <div className="space-y-1">
                    {testResults.structure.map((result: any) => (
                      <div key={result.table} className="flex items-center space-x-2">
                        <span className={result.exists ? 'text-green-600' : 'text-red-600'}>
                          {result.exists ? '✅' : '❌'}
                        </span>
                        <span className="text-sm">{result.table}</span>
                        {result.error && (
                          <span className="text-xs text-red-600">({result.error})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResults.rls && (
                <div className={`p-4 rounded-lg border-2 ${
                  testResults.rls.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <h3 className="font-medium text-gray-900">RLS Policies</h3>
                  <p className={`text-sm ${testResults.rls.success ? 'text-green-700' : 'text-red-700'}`}>
                    {testResults.rls.success ? '✅ Working' : `❌ Failed: ${testResults.rls.error}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Links */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-x-4">
              <a
                href="/admin/migration"
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Migration Page
              </a>
              <a
                href="/admin"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Admin Panel
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
