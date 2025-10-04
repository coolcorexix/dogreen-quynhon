import { supabase } from '../lib/supabase'

export interface ChecklistProgress {
  user_id: string
  activity_day: number
  completed: boolean
  completed_at?: string
}

export class ChecklistService {
  // Save user's checklist progress to Supabase
  static async saveUserProgress(userId: string, activityDay: number, completed: boolean) {
    try {
      const { data, error } = await supabase
        .from('user_checklist_progress')
        .upsert({
          user_id: userId,
          activity_day: activityDay,
          completed: completed,
          completed_at: completed ? new Date().toISOString() : null
        })

      if (error) {
        console.error('Error saving checklist progress:', error)
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error saving checklist progress:', error)
      return { success: false, error }
    }
  }

  // Get user's checklist progress from Supabase
  static async getUserProgress(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_checklist_progress')
        .select('*')
        .eq('user_id', userId)
        .order('activity_day')

      if (error) {
        console.error('Error fetching checklist progress:', error)
        return { success: false, error, data: [] }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching checklist progress:', error)
      return { success: false, error, data: [] }
    }
  }

  // Get user's completed activities count
  static async getCompletedCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('user_checklist_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true)

      if (error) {
        console.error('Error fetching completed count:', error)
        return { success: false, error, count: 0 }
      }

      return { success: true, count: count || 0 }
    } catch (error) {
      console.error('Error fetching completed count:', error)
      return { success: false, error, count: 0 }
    }
  }

  // Clear all user's progress (for testing purposes)
  static async clearUserProgress(userId: string) {
    try {
      const { error } = await supabase
        .from('user_checklist_progress')
        .delete()
        .eq('user_id', userId)

      if (error) {
        console.error('Error clearing user progress:', error)
        return { success: false, error }
      }

      return { success: true }
    } catch (error) {
      console.error('Error clearing user progress:', error)
      return { success: false, error }
    }
  }
}
