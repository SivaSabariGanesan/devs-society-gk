import { getSupabase, handleSupabaseError, Database } from '../database/supabase'

export interface IEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  eventType: 'college-specific' | 'open-to-all'
  targetCollege?: string // College ID
  maxAttendees: number
  category: 'workshop' | 'seminar' | 'hackathon' | 'competition' | 'meetup' | 'other'
  organizer: {
    adminId: string
    name: string
    contact: string
  }
  requirements: string[]
  prizes: string[]
  registrationDeadline: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface IEventRegistration {
  id: string
  eventId: string
  userId: string
  registeredAt: string
  status: 'confirmed' | 'waitlisted' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface CreateEventData {
  title: string
  description: string
  date: string
  time: string
  location: string
  eventType?: 'college-specific' | 'open-to-all'
  targetCollege?: string
  maxAttendees: number
  category?: 'workshop' | 'seminar' | 'hackathon' | 'competition' | 'meetup' | 'other'
  organizer: {
    adminId: string
    name: string
    contact: string
  }
  requirements?: string[]
  prizes?: string[]
  registrationDeadline: string
}

export interface UpdateEventData {
  title?: string
  description?: string
  date?: string
  time?: string
  location?: string
  eventType?: 'college-specific' | 'open-to-all'
  targetCollege?: string
  maxAttendees?: number
  category?: 'workshop' | 'seminar' | 'hackathon' | 'competition' | 'meetup' | 'other'
  organizer?: {
    adminId?: string
    name?: string
    contact?: string
  }
  requirements?: string[]
  prizes?: string[]
  registrationDeadline?: string
  isActive?: boolean
}

class EventService {
  private supabase = getSupabase()

  // Create a new event
  async createEvent(eventData: CreateEventData): Promise<IEvent> {
    try {
      const { data, error } = await this.supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          event_date: eventData.date,
          event_time: eventData.time,
          location: eventData.location,
          event_type: eventData.eventType || 'college-specific',
          target_college_id: eventData.targetCollege || null,
          max_attendees: eventData.maxAttendees,
          category: eventData.category || 'other',
          organizer_admin_id: eventData.organizer.adminId,
          organizer_name: eventData.organizer.name,
          organizer_contact: eventData.organizer.contact,
          requirements: eventData.requirements || [],
          prizes: eventData.prizes || [],
          registration_deadline: eventData.registrationDeadline,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        handleSupabaseError(error, 'createEvent')
      }

      return this.mapDbEventToEvent(data)
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  }

  // Find event by ID
  async findById(id: string): Promise<IEvent | null> {
    try {
      const { data, error } = await this.supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        handleSupabaseError(error, 'findById')
      }

      return this.mapDbEventToEvent(data)
    } catch (error) {
      console.error('Error finding event by ID:', error)
      throw error
    }
  }

  // Update event
  async updateEvent(id: string, updateData: UpdateEventData): Promise<IEvent | null> {
    try {
      const updateObj: any = {}

      if (updateData.title !== undefined) updateObj.title = updateData.title
      if (updateData.description !== undefined) updateObj.description = updateData.description
      if (updateData.date !== undefined) updateObj.event_date = updateData.date
      if (updateData.time !== undefined) updateObj.event_time = updateData.time
      if (updateData.location !== undefined) updateObj.location = updateData.location
      if (updateData.eventType !== undefined) updateObj.event_type = updateData.eventType
      if (updateData.targetCollege !== undefined) updateObj.target_college_id = updateData.targetCollege
      if (updateData.maxAttendees !== undefined) updateObj.max_attendees = updateData.maxAttendees
      if (updateData.category !== undefined) updateObj.category = updateData.category
      if (updateData.requirements !== undefined) updateObj.requirements = updateData.requirements
      if (updateData.prizes !== undefined) updateObj.prizes = updateData.prizes
      if (updateData.registrationDeadline !== undefined) updateObj.registration_deadline = updateData.registrationDeadline
      if (updateData.isActive !== undefined) updateObj.is_active = updateData.isActive

      if (updateData.organizer) {
        if (updateData.organizer.adminId !== undefined) updateObj.organizer_admin_id = updateData.organizer.adminId
        if (updateData.organizer.name !== undefined) updateObj.organizer_name = updateData.organizer.name
        if (updateData.organizer.contact !== undefined) updateObj.organizer_contact = updateData.organizer.contact
      }

      const { data, error } = await this.supabase
        .from('events')
        .update(updateObj)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        handleSupabaseError(error, 'updateEvent')
      }

      return this.mapDbEventToEvent(data)
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  }

  // Get all events
  async getAllEvents(activeOnly: boolean = true): Promise<IEvent[]> {
    try {
      let query = this.supabase
        .from('events')
        .select('*')

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      query = query.order('event_date', { ascending: false })

      const { data, error } = await query

      if (error) {
        handleSupabaseError(error, 'getAllEvents')
      }

      return data?.map(event => this.mapDbEventToEvent(event)) || []
    } catch (error) {
      console.error('Error getting all events:', error)
      throw error
    }
  }

  // Get upcoming events
  async getUpcomingEvents(activeOnly: boolean = true): Promise<IEvent[]> {
    try {
      const now = new Date().toISOString().split('T')[0] // Get current date in YYYY-MM-DD format

      let query = this.supabase
        .from('events')
        .select('*')
        .gte('event_date', now)

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      query = query.order('event_date', { ascending: true })

      const { data, error } = await query

      if (error) {
        handleSupabaseError(error, 'getUpcomingEvents')
      }

      return data?.map(event => this.mapDbEventToEvent(event)) || []
    } catch (error) {
      console.error('Error getting upcoming events:', error)
      throw error
    }
  }

  // Get events by college
  async getEventsByCollege(collegeId: string, activeOnly: boolean = true): Promise<IEvent[]> {
    try {
      let query = this.supabase
        .from('events')
        .select('*')
        .or(`event_type.eq.open-to-all,and(event_type.eq.college-specific,target_college_id.eq.${collegeId})`)

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      query = query.order('event_date', { ascending: false })

      const { data, error } = await query

      if (error) {
        handleSupabaseError(error, 'getEventsByCollege')
      }

      return data?.map(event => this.mapDbEventToEvent(event)) || []
    } catch (error) {
      console.error('Error getting events by college:', error)
      throw error
    }
  }

  // Get events by organizer
  async getEventsByOrganizer(adminId: string, activeOnly: boolean = true): Promise<IEvent[]> {
    try {
      let query = this.supabase
        .from('events')
        .select('*')
        .eq('organizer_admin_id', adminId)

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      query = query.order('event_date', { ascending: false })

      const { data, error } = await query

      if (error) {
        handleSupabaseError(error, 'getEventsByOrganizer')
      }

      return data?.map(event => this.mapDbEventToEvent(event)) || []
    } catch (error) {
      console.error('Error getting events by organizer:', error)
      throw error
    }
  }

  // Soft delete event
  async deleteEvent(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('events')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        handleSupabaseError(error, 'deleteEvent')
      }

      return true
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  }

  // Event Registration Methods

  // Register user for event
  async registerForEvent(eventId: string, userId: string): Promise<IEventRegistration> {
    try {
      // Check if user can register
      const canRegister = await this.canUserRegister(eventId, userId)
      if (!canRegister.canRegister) {
        throw new Error(canRegister.reason)
      }

      const { data, error } = await this.supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: canRegister.status || 'confirmed'
        })
        .select()
        .single()

      if (error) {
        handleSupabaseError(error, 'registerForEvent')
      }

      return this.mapDbRegistrationToRegistration(data)
    } catch (error) {
      console.error('Error registering for event:', error)
      throw error
    }
  }

  // Unregister user from event
  async unregisterFromEvent(eventId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('event_registrations')
        .update({ status: 'cancelled' })
        .eq('event_id', eventId)
        .eq('user_id', userId)

      if (error) {
        handleSupabaseError(error, 'unregisterFromEvent')
      }

      return true
    } catch (error) {
      console.error('Error unregistering from event:', error)
      throw error
    }
  }

  // Get event registrations
  async getEventRegistrations(eventId: string, status?: 'confirmed' | 'waitlisted' | 'cancelled'): Promise<IEventRegistration[]> {
    try {
      let query = this.supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)

      if (status) {
        query = query.eq('status', status)
      }

      query = query.order('registered_at', { ascending: true })

      const { data, error } = await query

      if (error) {
        handleSupabaseError(error, 'getEventRegistrations')
      }

      return data?.map(reg => this.mapDbRegistrationToRegistration(reg)) || []
    } catch (error) {
      console.error('Error getting event registrations:', error)
      throw error
    }
  }

  // Get user registrations
  async getUserRegistrations(userId: string, status?: 'confirmed' | 'waitlisted' | 'cancelled'): Promise<IEventRegistration[]> {
    try {
      let query = this.supabase
        .from('event_registrations')
        .select('*')
        .eq('user_id', userId)

      if (status) {
        query = query.eq('status', status)
      }

      query = query.order('registered_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        handleSupabaseError(error, 'getUserRegistrations')
      }

      return data?.map(reg => this.mapDbRegistrationToRegistration(reg)) || []
    } catch (error) {
      console.error('Error getting user registrations:', error)
      throw error
    }
  }

  // Check if user can register for event
  async canUserRegister(eventId: string, userId: string): Promise<{
    canRegister: boolean
    reason?: string
    status?: 'confirmed' | 'waitlisted'
  }> {
    try {
      const event = await this.findById(eventId)
      if (!event) {
        return { canRegister: false, reason: 'Event not found' }
      }

      const now = new Date()
      const deadline = new Date(event.registrationDeadline)

      // Check if registration is still open
      if (now > deadline) {
        return { canRegister: false, reason: 'Registration deadline passed' }
      }

      // Check if user already registered
      const { data: existingReg, error } = await this.supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .single()

      if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error, 'canUserRegister')
      }

      if (existingReg) {
        return { canRegister: false, reason: 'Already registered' }
      }

      // Check if spots available
      const confirmedCount = await this.getConfirmedRegistrationCount(eventId)
      if (confirmedCount >= event.maxAttendees) {
        return { canRegister: true, status: 'waitlisted' }
      }

      return { canRegister: true, status: 'confirmed' }
    } catch (error) {
      console.error('Error checking if user can register:', error)
      return { canRegister: false, reason: 'Error checking registration eligibility' }
    }
  }

  // Get available spots for event
  async getAvailableSpots(eventId: string): Promise<number> {
    try {
      const event = await this.findById(eventId)
      if (!event) return 0

      const confirmedCount = await this.getConfirmedRegistrationCount(eventId)
      return Math.max(0, event.maxAttendees - confirmedCount)
    } catch (error) {
      console.error('Error getting available spots:', error)
      return 0
    }
  }

  // Get confirmed registration count
  private async getConfirmedRegistrationCount(eventId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'confirmed')

      if (error) {
        handleSupabaseError(error, 'getConfirmedRegistrationCount')
      }

      return count || 0
    } catch (error) {
      console.error('Error getting confirmed registration count:', error)
      return 0
    }
  }

  // Search events
  async searchEvents(searchTerm: string, activeOnly: boolean = true): Promise<IEvent[]> {
    try {
      let query = this.supabase
        .from('events')
        .select('*')

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
        .order('event_date', { ascending: false })

      const { data, error } = await query

      if (error) {
        handleSupabaseError(error, 'searchEvents')
      }

      return data?.map(event => this.mapDbEventToEvent(event)) || []
    } catch (error) {
      console.error('Error searching events:', error)
      throw error
    }
  }

  // Helper method to map database event to IEvent interface
  private mapDbEventToEvent(dbEvent: Database['public']['Tables']['events']['Row']): IEvent {
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description,
      date: dbEvent.event_date,
      time: dbEvent.event_time,
      location: dbEvent.location,
      eventType: dbEvent.event_type,
      targetCollege: dbEvent.target_college_id || undefined,
      maxAttendees: dbEvent.max_attendees,
      category: dbEvent.category,
      organizer: {
        adminId: dbEvent.organizer_admin_id,
        name: dbEvent.organizer_name,
        contact: dbEvent.organizer_contact
      },
      requirements: dbEvent.requirements as string[],
      prizes: dbEvent.prizes as string[],
      registrationDeadline: dbEvent.registration_deadline,
      isActive: dbEvent.is_active,
      createdAt: dbEvent.created_at,
      updatedAt: dbEvent.updated_at
    }
  }

  // Helper method to map database registration to IEventRegistration interface
  private mapDbRegistrationToRegistration(dbReg: Database['public']['Tables']['event_registrations']['Row']): IEventRegistration {
    return {
      id: dbReg.id,
      eventId: dbReg.event_id,
      userId: dbReg.user_id,
      registeredAt: dbReg.registered_at,
      status: dbReg.status,
      createdAt: dbReg.created_at,
      updatedAt: dbReg.updated_at
    }
  }
}

export default new EventService() 