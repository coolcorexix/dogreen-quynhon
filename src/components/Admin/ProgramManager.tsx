import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Program, Activity, ProgramWithActivities } from '../../types/database'
import { useAuth } from '../../contexts/AuthContext'

interface ProgramManagerProps {
  onProgramChange?: () => void
}

export const ProgramManager: React.FC<ProgramManagerProps> = ({ onProgramChange }) => {
  const { user } = useAuth()
  const [programs, setPrograms] = useState<ProgramWithActivities[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_days: 30,
    is_active: true
  })
  const [selectedActivities, setSelectedActivities] = useState<{ activity_id: string; day_order: number }[]>([])

  useEffect(() => {
    fetchPrograms()
    fetchActivities()
  }, [])

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          program_activities (
            id,
            day_order,
            activity:activities (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const programsWithActivities = (data || []).map(program => ({
        ...program,
        activities: program.program_activities || [],
        enrollment_count: 0 // This would need a separate query for actual count
      }))
      
      setPrograms(programsWithActivities)
    } catch (error) {
      console.error('Error fetching programs:', error)
    } finally {
      setLoading(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingProgram) {
        // Update existing program
        const { error: programError } = await supabase
          .from('programs')
          .update(formData)
          .eq('id', editingProgram.id)

        if (programError) throw programError

        // Update program activities
        await updateProgramActivities(editingProgram.id)
      } else {
        // Create new program
        if (!user) {
          throw new Error('User must be logged in to create programs')
        }
        
        const { data: programData, error: programError } = await supabase
          .from('programs')
          .insert([{
            ...formData,
            created_by: user.id
          }])
          .select()
          .single()

        if (programError) throw programError

        // Add program activities
        if (selectedActivities.length > 0) {
          await updateProgramActivities(programData.id)
        }
      }

      // Reset form and refresh data
      resetForm()
      fetchPrograms()
      onProgramChange?.()
    } catch (error) {
      console.error('Error saving program:', error)
    }
  }

  const updateProgramActivities = async (programId: string) => {
    // First, delete existing program activities
    await supabase
      .from('program_activities')
      .delete()
      .eq('program_id', programId)

    // Then insert new ones
    if (selectedActivities.length > 0) {
      const programActivities = selectedActivities.map(pa => ({
        program_id: programId,
        activity_id: pa.activity_id,
        day_order: pa.day_order
      }))

      const { error } = await supabase
        .from('program_activities')
        .insert(programActivities)

      if (error) throw error
    }
  }

  const handleEdit = (program: Program) => {
    setEditingProgram(program)
    setFormData({
      name: program.name,
      description: program.description || '',
      duration_days: program.duration_days,
      is_active: program.is_active
    })
    
    // Load existing program activities
    const programWithActivities = programs.find(p => p.id === program.id)
    if (programWithActivities) {
      const activities = programWithActivities.activities.map(pa => ({
        activity_id: pa.activity?.id || '',
        day_order: pa.day_order
      }))
      setSelectedActivities(activities)
    }
    
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program? This will also delete all associated program activities.')) return

    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPrograms()
      onProgramChange?.()
    } catch (error) {
      console.error('Error deleting program:', error)
    }
  }

  const addActivityToProgram = () => {
    setSelectedActivities([...selectedActivities, { activity_id: '', day_order: selectedActivities.length + 1 }])
  }

  const removeActivityFromProgram = (index: number) => {
    setSelectedActivities(selectedActivities.filter((_, i) => i !== index))
  }

  const updateActivityInProgram = (index: number, field: 'activity_id' | 'day_order', value: string | number) => {
    const updated = [...selectedActivities]
    updated[index] = { ...updated[index], [field]: value }
    setSelectedActivities(updated)
  }

  const moveActivityUp = (index: number) => {
    if (index === 0) return
    const updated = [...selectedActivities]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    // Update day_order values
    updated.forEach((activity, i) => {
      activity.day_order = i + 1
    })
    setSelectedActivities(updated)
  }

  const moveActivityDown = (index: number) => {
    if (index === selectedActivities.length - 1) return
    const updated = [...selectedActivities]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    // Update day_order values
    updated.forEach((activity, i) => {
      activity.day_order = i + 1
    })
    setSelectedActivities(updated)
  }


  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration_days: 30,
      is_active: true
    })
    setSelectedActivities([])
    setEditingProgram(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="flex justify-center p-4">Loading programs...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Programs</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Program
        </button>
      </div>

      {/* Program Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingProgram ? 'Edit Program' : 'Add New Program'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (days) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>

            {/* Program Activities */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Program Activities
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Use the up/down arrows to reorder activities. Day order updates automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addActivityToProgram}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Activity
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedActivities.map((activity, index) => (
                  <div 
                    key={index} 
                    className={`flex space-x-2 items-center p-2 border rounded-lg transition-colors ${
                      activities.find(act => act.id === activity.activity_id)?.is_checkpoint
                        ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 shadow-md'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* Reorder Controls */}
                    <div className="flex flex-col space-y-1">
                      <button
                        type="button"
                        onClick={() => moveActivityUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveActivityDown(index)}
                        disabled={index === selectedActivities.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>


                    {/* Activity Selector */}
                    <div className="flex-1">
                      <select
                        value={activity.activity_id}
                        onChange={(e) => updateActivityInProgram(index, 'activity_id', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          activities.find(act => act.id === activity.activity_id)?.is_checkpoint
                            ? 'border-amber-400 bg-amber-50 focus:ring-amber-500 text-amber-900 font-semibold'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        required
                      >
                        <option value="">Select Activity</option>
                        {activities.map(act => (
                          <option key={act.id} value={act.id}>
                            {act.title} {act.is_checkpoint && '(Checkpoint)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Checkpoint Badge */}
                    {activities.find(act => act.id === activity.activity_id)?.is_checkpoint && (
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          CHECKPOINT
                        </span>
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeActivityFromProgram(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Remove activity"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingProgram ? 'Update Program' : 'Create Program'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Programs List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activities
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {programs.map((program) => (
                <tr key={program.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {program.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {program.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {program.duration_days} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {program.activities.length} activities
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      program.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {program.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(program)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(program.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
