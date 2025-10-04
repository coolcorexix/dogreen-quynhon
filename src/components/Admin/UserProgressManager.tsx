import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { UserProgressSummary, Program, Activity, UserProfile } from '../../types/database'

interface UserProgressManagerProps {
  onProgressChange?: () => void
}

export const UserProgressManager: React.FC<UserProgressManagerProps> = ({ onProgressChange }) => {
  const [userProgress, setUserProgress] = useState<UserProgressSummary[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [selectedActivity, setSelectedActivity] = useState<string>('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showBulkVerification, setShowBulkVerification] = useState(false)

  useEffect(() => {
    fetchPrograms()
    fetchActivities()
  }, [])

  useEffect(() => {
    if (selectedProgram) {
      fetchUserProgress(selectedProgram)
    }
  }, [selectedProgram])

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setPrograms(data || [])
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('title')

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const fetchUserProgress = async (programId: string) => {
    setLoading(true)
    try {
      // Get all users enrolled in this program
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('user_program_enrollment')
        .select(`
          user_id,
          user_profile:user_profiles (*),
          program:programs (*)
        `)
        .eq('program_id', programId)
        .eq('is_active', true)

      if (enrollmentError) throw enrollmentError

      // Get program activities count
      const { data: programActivities, error: activitiesError } = await supabase
        .from('program_activities')
        .select('activity_id')
        .eq('program_id', programId)

      if (activitiesError) throw activitiesError

      const totalActivities = programActivities?.length || 0

      // Get completion data for each user
      const progressSummaries: UserProgressSummary[] = []
      
      for (const enrollment of enrollments || []) {
        const { data: completions, error: completionError } = await supabase
          .from('user_activity_completion')
          .select('*')
          .eq('user_id', enrollment.user_id)
          .eq('program_id', programId)

        if (completionError) {
          console.error('Error fetching completions for user:', enrollment.user_id, completionError)
          continue
        }

        const completedActivities = completions?.length || 0
        const verifiedActivities = completions?.filter(c => c.is_verified).length || 0
        const pendingVerification = completedActivities - verifiedActivities

        progressSummaries.push({
          user_id: enrollment.user_id,
          user_profile: enrollment.user_profile as UserProfile,
          program_id: programId,
          program: enrollment.program as Program,
          total_activities: totalActivities,
          completed_activities: completedActivities,
          verified_activities: verifiedActivities,
          pending_verification: pendingVerification,
          total_score: enrollment.user_profile?.total_score || 0,
          progress_percentage: totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0
        })
      }

      setUserProgress(progressSummaries)
    } catch (error) {
      console.error('Error fetching user progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkVerification = async () => {
    if (selectedUsers.length === 0 || !selectedActivity) {
      alert('Please select users and an activity to verify')
      return
    }

    try {
      // Get current user ID for verification
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to verify activities')
        return
      }

      // Create completion records for selected users
      const completionRecords = selectedUsers.map(userId => ({
        user_id: userId,
        program_id: selectedProgram,
        activity_id: selectedActivity,
        completed_at: new Date().toISOString(),
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        is_verified: true
      }))

      const { error } = await supabase
        .from('user_activity_completion')
        .upsert(completionRecords, { 
          onConflict: 'user_id,program_id,activity_id',
          ignoreDuplicates: false 
        })

      if (error) throw error

      // Reset selections and refresh data
      setSelectedUsers([])
      setSelectedActivity('')
      setShowBulkVerification(false)
      fetchUserProgress(selectedProgram)
      onProgressChange?.()
      
      alert(`Successfully verified activity for ${selectedUsers.length} users`)
    } catch (error) {
      console.error('Error in bulk verification:', error)
      alert('Error verifying activities. Please try again.')
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    setSelectedUsers(userProgress.map(up => up.user_id))
  }

  const clearSelection = () => {
    setSelectedUsers([])
  }

  const filteredActivities = activities.filter(activity => {
    // Only show activities that are part of the selected program
    // This would need to be implemented based on your program_activities table
    return true // For now, show all activities
  })

  if (loading && !selectedProgram) {
    return <div className="flex justify-center p-4">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Progress Management</h2>
        {selectedProgram && (
          <button
            onClick={() => setShowBulkVerification(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Bulk Verify Activities
          </button>
        )}
      </div>

      {/* Program Selection */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Program
        </label>
        <select
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Choose a program...</option>
          {programs.map(program => (
            <option key={program.id} value={program.id}>
              {program.name} ({program.duration_days} days)
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Verification Modal */}
      {showBulkVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Bulk Activity Verification</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Activity to Verify
                </label>
                <select
                  value={selectedActivity}
                  onChange={(e) => setSelectedActivity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose an activity...</option>
                  {filteredActivities.map(activity => (
                    <option key={activity.id} value={activity.id}>
                      {activity.title} {activity.is_checkpoint && '(Checkpoint)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Users ({selectedUsers.length} selected)
                  </label>
                  <div className="space-x-2">
                    <button
                      onClick={selectAllUsers}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearSelection}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                  {userProgress.map(up => (
                    <label key={up.user_id} className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(up.user_id)}
                        onChange={() => toggleUserSelection(up.user_id)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {up.user_profile?.full_name || up.user_profile?.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          Progress: {up.progress_percentage}% | Score: {up.total_score}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleBulkVerification}
                disabled={selectedUsers.length === 0 || !selectedActivity}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Verify for {selectedUsers.length} Users
              </button>
              <button
                onClick={() => setShowBulkVerification(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Progress Table */}
      {selectedProgram && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activities
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userProgress.map((up) => (
                  <tr key={up.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {up.user_profile?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {up.user_profile?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${up.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{up.progress_percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>Completed: {up.completed_activities}/{up.total_activities}</div>
                        <div className="text-xs text-gray-500">
                          Verified: {up.verified_activities} | Pending: {up.pending_verification}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {up.total_score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {up.user_profile?.level || 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
