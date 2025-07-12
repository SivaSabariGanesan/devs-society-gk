export interface IEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    eventType: 'college-specific' | 'open-to-all';
    targetCollege?: string;
    maxAttendees: number;
    category: 'workshop' | 'seminar' | 'hackathon' | 'competition' | 'meetup' | 'other';
    organizer: {
        adminId: string;
        name: string;
        contact: string;
    };
    requirements: string[];
    prizes: string[];
    registrationDeadline: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface IEventRegistration {
    id: string;
    eventId: string;
    userId: string;
    registeredAt: string;
    status: 'confirmed' | 'waitlisted' | 'cancelled';
    createdAt: string;
    updatedAt: string;
}
export interface CreateEventData {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    eventType?: 'college-specific' | 'open-to-all';
    targetCollege?: string;
    maxAttendees: number;
    category?: 'workshop' | 'seminar' | 'hackathon' | 'competition' | 'meetup' | 'other';
    organizer: {
        adminId: string;
        name: string;
        contact: string;
    };
    requirements?: string[];
    prizes?: string[];
    registrationDeadline: string;
}
export interface UpdateEventData {
    title?: string;
    description?: string;
    date?: string;
    time?: string;
    location?: string;
    eventType?: 'college-specific' | 'open-to-all';
    targetCollege?: string;
    maxAttendees?: number;
    category?: 'workshop' | 'seminar' | 'hackathon' | 'competition' | 'meetup' | 'other';
    organizer?: {
        adminId?: string;
        name?: string;
        contact?: string;
    };
    requirements?: string[];
    prizes?: string[];
    registrationDeadline?: string;
    isActive?: boolean;
}
declare class EventService {
    private supabase;
    createEvent(eventData: CreateEventData): Promise<IEvent>;
    findById(id: string): Promise<IEvent | null>;
    updateEvent(id: string, updateData: UpdateEventData): Promise<IEvent | null>;
    getAllEvents(activeOnly?: boolean): Promise<IEvent[]>;
    getUpcomingEvents(activeOnly?: boolean): Promise<IEvent[]>;
    getEventsByCollege(collegeId: string, activeOnly?: boolean): Promise<IEvent[]>;
    getEventsByOrganizer(adminId: string, activeOnly?: boolean): Promise<IEvent[]>;
    deleteEvent(id: string): Promise<boolean>;
    registerForEvent(eventId: string, userId: string): Promise<IEventRegistration>;
    unregisterFromEvent(eventId: string, userId: string): Promise<boolean>;
    getEventRegistrations(eventId: string, status?: 'confirmed' | 'waitlisted' | 'cancelled'): Promise<IEventRegistration[]>;
    getUserRegistrations(userId: string, status?: 'confirmed' | 'waitlisted' | 'cancelled'): Promise<IEventRegistration[]>;
    canUserRegister(eventId: string, userId: string): Promise<{
        canRegister: boolean;
        reason?: string;
        status?: 'confirmed' | 'waitlisted';
    }>;
    getAvailableSpots(eventId: string): Promise<number>;
    private getConfirmedRegistrationCount;
    searchEvents(searchTerm: string, activeOnly?: boolean): Promise<IEvent[]>;
    private mapDbEventToEvent;
    private mapDbRegistrationToRegistration;
}
declare const _default: EventService;
export default _default;
//# sourceMappingURL=eventService.d.ts.map