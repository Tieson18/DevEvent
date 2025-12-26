import * as DatabaseIndex from '@/database/index';
import { Event, IEvent } from '@/database/event.model';
import { Booking, IBooking } from '@/database/booking.model';

describe('Database Index Module', () => {
  describe('Exports', () => {
    it('should export Event model', () => {
      expect(DatabaseIndex.Event).toBeDefined();
      expect(DatabaseIndex.Event).toBe(Event);
    });

    it('should export Booking model', () => {
      expect(DatabaseIndex.Booking).toBeDefined();
      expect(DatabaseIndex.Booking).toBe(Booking);
    });

    it('should export IEvent type', () => {
      // TypeScript type check - this will fail at compile time if type is not exported
      const event: DatabaseIndex.IEvent = {
        title: 'Test Event',
        slug: 'test-event',
        description: 'Test description',
        overview: 'Test overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: new Date(),
        time: '14:30',
        mode: 'Online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Org',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(event).toBeDefined();
    });

    it('should export IBooking type', () => {
      // TypeScript type check
      const booking: DatabaseIndex.IBooking = {
        eventId: Event.schema.obj.title as any,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(booking).toBeDefined();
    });

    it('should have exactly 4 exports (Event, Booking, IEvent, IBooking)', () => {
      const exports = Object.keys(DatabaseIndex);
      expect(exports).toHaveLength(4);
      expect(exports).toContain('Event');
      expect(exports).toContain('Booking');
      expect(exports).toContain('IEvent');
      expect(exports).toContain('IBooking');
    });

    it('should allow creating Event through index export', async () => {
      const event = new DatabaseIndex.Event({
        title: 'Index Test Event',
        description: 'Test description',
        overview: 'Test overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: new Date('2024-12-31'),
        time: '14:30',
        mode: 'Online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Org',
        tags: ['test'],
      });

      const savedEvent = await event.save();
      expect(savedEvent).toBeDefined();
      expect(savedEvent.title).toBe('Index Test Event');
    });

    it('should allow creating Booking through index export', async () => {
      const event = await DatabaseIndex.Event.create({
        title: 'Event for Booking',
        description: 'Test description',
        overview: 'Test overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: new Date('2024-12-31'),
        time: '14:30',
        mode: 'Online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Org',
        tags: ['test'],
      });

      const booking = new DatabaseIndex.Booking({
        eventId: event._id,
        email: 'index@example.com',
      });

      const savedBooking = await booking.save();
      expect(savedBooking).toBeDefined();
      expect(savedBooking.email).toBe('index@example.com');
    });
  });

  describe('Module Structure', () => {
    it('should be importable with named imports', () => {
      const { Event, Booking } = require('@/database/index');
      
      expect(Event).toBeDefined();
      expect(Booking).toBeDefined();
    });

    it('should be importable with namespace import', () => {
      const Database = require('@/database/index');
      
      expect(Database.Event).toBeDefined();
      expect(Database.Booking).toBeDefined();
    });

    it('should maintain model references correctly', () => {
      expect(DatabaseIndex.Event.modelName).toBe('Event');
      expect(DatabaseIndex.Booking.modelName).toBe('Booking');
    });

    it('should provide access to model schemas', () => {
      expect(DatabaseIndex.Event.schema).toBeDefined();
      expect(DatabaseIndex.Booking.schema).toBeDefined();
    });
  });

  describe('Type Compatibility', () => {
    it('should allow using IEvent type for creating events', async () => {
      const eventData: DatabaseIndex.IEvent = {
        title: 'Typed Event',
        slug: 'typed-event',
        description: 'Description',
        overview: 'Overview',
        image: 'https://example.com/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: new Date('2024-12-31'),
        time: '10:00',
        mode: 'Hybrid',
        audience: 'All',
        agenda: ['Agenda'],
        organizer: 'Org',
        tags: ['tag'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Should be compatible with Event model
      const event = new DatabaseIndex.Event(eventData);
      expect(event).toBeDefined();
    });

    it('should allow using IBooking type for creating bookings', async () => {
      const event = await DatabaseIndex.Event.create({
        title: 'Event',
        description: 'Desc',
        overview: 'Overview',
        image: 'https://example.com/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: new Date(),
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['tag'],
      });

      const bookingData: Partial<DatabaseIndex.IBooking> = {
        eventId: event._id as any,
        email: 'typed@example.com',
      };

      const booking = new DatabaseIndex.Booking(bookingData);
      expect(booking).toBeDefined();
    });
  });

  describe('Re-export Consistency', () => {
    it('should re-export same Event model as event.model.ts', () => {
      const DirectEvent = require('@/database/event.model').Event;
      const IndexEvent = DatabaseIndex.Event;

      expect(IndexEvent).toBe(DirectEvent);
    });

    it('should re-export same Booking model as booking.model.ts', () => {
      const DirectBooking = require('@/database/booking.model').Booking;
      const IndexBooking = DatabaseIndex.Booking;

      expect(IndexBooking).toBe(DirectBooking);
    });
  });

  describe('Practical Usage', () => {
    it('should support typical import patterns for Event', async () => {
      const { Event: ImportedEvent } = DatabaseIndex;
      
      const event = await ImportedEvent.create({
        title: 'Practical Event',
        description: 'Description',
        overview: 'Overview',
        image: 'https://example.com/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: new Date(),
        time: '15:00',
        mode: 'In-Person',
        audience: 'Developers',
        agenda: ['Keynote'],
        organizer: 'TechCorp',
        tags: ['tech'],
      });

      expect(event).toBeDefined();
      expect(event.title).toBe('Practical Event');
    });

    it('should support typical import patterns for Booking', async () => {
      const event = await DatabaseIndex.Event.create({
        title: 'Event',
        description: 'Desc',
        overview: 'Overview',
        image: 'https://example.com/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: new Date(),
        time: '10:00',
        mode: 'Online',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['tag'],
      });

      const { Booking: ImportedBooking } = DatabaseIndex;
      
      const booking = await ImportedBooking.create({
        eventId: event._id,
        email: 'practical@example.com',
      });

      expect(booking).toBeDefined();
      expect(booking.email).toBe('practical@example.com');
    });

    it('should support querying models through index', async () => {
      await DatabaseIndex.Event.create({
        title: 'Query Event',
        description: 'Desc',
        overview: 'Overview',
        image: 'https://example.com/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: new Date(),
        time: '12:00',
        mode: 'Virtual',
        audience: 'Students',
        agenda: ['Session'],
        organizer: 'School',
        tags: ['education'],
      });

      const events = await DatabaseIndex.Event.find({ title: 'Query Event' });
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Query Event');
    });
  });
});