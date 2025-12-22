import mongoose from 'mongoose';
import { Booking, IBooking } from '@/database/booking.model';
import { Event } from '@/database/event.model';

describe('Booking Model', () => {
  let testEventId: mongoose.Types.ObjectId;

  // Create a test event before each test
  beforeEach(async () => {
    const event = await Event.create({
      title: 'Test Event',
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
    testEventId = event._id as mongoose.Types.ObjectId;
  });

  const validBookingData = {
    email: 'test@example.com',
  };

  describe('Booking Creation - Happy Path', () => {
    it('should create a valid booking with all required fields', async () => {
      const booking = new Booking({
        ...validBookingData,
        eventId: testEventId,
      });
      const savedBooking = await booking.save();

      expect(savedBooking._id).toBeDefined();
      expect(savedBooking.eventId).toEqual(testEventId);
      expect(savedBooking.email).toBe(validBookingData.email);
      expect(savedBooking.createdAt).toBeDefined();
      expect(savedBooking.updatedAt).toBeDefined();
    });

    it('should convert email to lowercase', async () => {
      const booking = new Booking({
        email: 'TEST@EXAMPLE.COM',
        eventId: testEventId,
      });
      const savedBooking = await booking.save();

      expect(savedBooking.email).toBe('test@example.com');
    });

    it('should trim whitespace from email', async () => {
      const booking = new Booking({
        email: '  test@example.com  ',
        eventId: testEventId,
      });
      const savedBooking = await booking.save();

      expect(savedBooking.email).toBe('test@example.com');
    });

    it('should normalize email (uppercase + whitespace)', async () => {
      const booking = new Booking({
        email: '  TEST@EXAMPLE.COM  ',
        eventId: testEventId,
      });
      const savedBooking = await booking.save();

      expect(savedBooking.email).toBe('test@example.com');
    });

    it('should accept various valid email formats', async () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'user123@test123.org',
        'a@b.co',
      ];

      for (const email of validEmails) {
        const booking = new Booking({
          email,
          eventId: testEventId,
        });
        const savedBooking = await booking.save();

        expect(savedBooking.email).toBe(email.toLowerCase());
        await Booking.deleteMany({ email: email.toLowerCase() });
      }
    });
  });

  describe('Email Validation', () => {
    it('should reject booking without email', async () => {
      const booking = new Booking({
        email: undefined as any,
        eventId: testEventId,
      });

      await expect(booking.save()).rejects.toThrow('Email is required');
    });

    it('should reject booking with empty email', async () => {
      const booking = new Booking({
        email: '',
        eventId: testEventId,
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should reject email without @ symbol', async () => {
      const booking = new Booking({
        email: 'invalidemail.com',
        eventId: testEventId,
      });

      await expect(booking.save()).rejects.toThrow('Invalid email format.');
    });

    it('should reject email without domain', async () => {
      const booking = new Booking({
        email: 'user@',
        eventId: testEventId,
      });

      await expect(booking.save()).rejects.toThrow('Invalid email format.');
    });

    it('should reject email without local part', async () => {
      const booking = new Booking({
        email: '@example.com',
        eventId: testEventId,
      });

      await expect(booking.save()).rejects.toThrow('Invalid email format.');
    });

    it('should reject email without TLD', async () => {
      const booking = new Booking({
        email: 'user@example',
        eventId: testEventId,
      });

      await expect(booking.save()).rejects.toThrow('Invalid email format.');
    });

    it('should reject email with spaces', async () => {
      const booking = new Booking({
        email: 'user name@example.com',
        eventId: testEventId,
      });

      await expect(booking.save()).rejects.toThrow('Invalid email format.');
    });

    it('should reject email with multiple @ symbols', async () => {
      const booking = new Booking({
        email: 'user@@example.com',
        eventId: testEventId,
      });

      await expect(booking.save()).rejects.toThrow('Invalid email format.');
    });

    it('should reject email with invalid characters', async () => {
      const booking = new Booking({
        email: 'user#name@example.com',
        eventId: testEventId,
      });

      await expect(booking.save()).rejects.toThrow('Invalid email format.');
    });

    it('should reject email starting with dot', async () => {
      const booking = new Booking({
        email: '.user@example.com',
        eventId: testEventId,
      });

      await expect(booking.save()).rejects.toThrow('Invalid email format.');
    });

    it('should reject email ending with dot before @', async () => {
      const booking = new Booking({
        email: 'user.@example.com',
        eventId: testEventId,
      });

      await expect(booking.save()).rejects.toThrow('Invalid email format.');
    });
  });

  describe('Event Reference Validation', () => {
    it('should reject booking without eventId', async () => {
      const booking = new Booking({
        email: validBookingData.email,
        eventId: undefined as any,
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should reject booking with non-existent eventId', async () => {
      const fakeEventId = new mongoose.Types.ObjectId();
      const booking = new Booking({
        email: validBookingData.email,
        eventId: fakeEventId,
      });

      await expect(booking.save()).rejects.toThrow('Referenced event does not exist.');
    });

    it('should validate eventId on new booking', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const booking = new Booking({
        email: validBookingData.email,
        eventId: nonExistentId,
      });

      await expect(booking.save()).rejects.toThrow('Referenced event does not exist.');
    });

    it('should accept booking with valid existing eventId', async () => {
      const booking = new Booking({
        email: validBookingData.email,
        eventId: testEventId,
      });

      await expect(booking.save()).resolves.toBeDefined();
    });

    it('should validate eventId when it is modified', async () => {
      const booking = await Booking.create({
        email: validBookingData.email,
        eventId: testEventId,
      });

      const newEvent = await Event.create({
        title: 'Another Event',
        description: 'Test description',
        overview: 'Test overview',
        image: 'https://example.com/image2.jpg',
        venue: 'Test Venue 2',
        location: 'Test Location 2',
        date: new Date('2025-01-15'),
        time: '10:00',
        mode: 'Hybrid',
        audience: 'All',
        agenda: ['Agenda item'],
        organizer: 'Organizer',
        tags: ['tag1'],
      });

      booking.eventId = newEvent._id as mongoose.Types.ObjectId;
      await expect(booking.save()).resolves.toBeDefined();
    });

    it('should reject when eventId is changed to non-existent event', async () => {
      const booking = await Booking.create({
        email: validBookingData.email,
        eventId: testEventId,
      });

      const fakeId = new mongoose.Types.ObjectId();
      booking.eventId = fakeId;

      await expect(booking.save()).rejects.toThrow('Referenced event does not exist.');
    });

    it('should not re-validate eventId when other fields are updated', async () => {
      const booking = await Booking.create({
        email: validBookingData.email,
        eventId: testEventId,
      });

      // This should not trigger eventId validation
      booking.email = 'newemail@example.com';
      
      // Delete unique index violation by cleaning up
      await Booking.deleteMany({ email: 'newemail@example.com', eventId: testEventId });
      
      await expect(booking.save()).resolves.toBeDefined();
    });
  });

  describe('Duplicate Booking Prevention', () => {
    it('should prevent duplicate booking for same event and email', async () => {
      await Booking.create({
        email: validBookingData.email,
        eventId: testEventId,
      });

      const duplicateBooking = new Booking({
        email: validBookingData.email,
        eventId: testEventId,
      });

      await expect(duplicateBooking.save()).rejects.toThrow();
    });

    it('should allow same email for different events', async () => {
      const event2 = await Event.create({
        title: 'Second Event',
        description: 'Description 2',
        overview: 'Overview 2',
        image: 'https://example.com/image2.jpg',
        venue: 'Venue 2',
        location: 'Location 2',
        date: new Date('2025-01-15'),
        time: '16:00',
        mode: 'Virtual',
        audience: 'Students',
        agenda: ['Session 1'],
        organizer: 'Org 2',
        tags: ['tag2'],
      });

      await Booking.create({
        email: validBookingData.email,
        eventId: testEventId,
      });

      const booking2 = new Booking({
        email: validBookingData.email,
        eventId: event2._id,
      });

      await expect(booking2.save()).resolves.toBeDefined();
    });

    it('should allow different emails for same event', async () => {
      await Booking.create({
        email: 'user1@example.com',
        eventId: testEventId,
      });

      const booking2 = new Booking({
        email: 'user2@example.com',
        eventId: testEventId,
      });

      await expect(booking2.save()).resolves.toBeDefined();
    });

    it('should treat case-insensitive emails as duplicates', async () => {
      await Booking.create({
        email: 'test@example.com',
        eventId: testEventId,
      });

      const duplicateBooking = new Booking({
        email: 'TEST@EXAMPLE.COM',
        eventId: testEventId,
      });

      await expect(duplicateBooking.save()).rejects.toThrow();
    });

    it('should treat trimmed emails as duplicates', async () => {
      await Booking.create({
        email: 'test@example.com',
        eventId: testEventId,
      });

      const duplicateBooking = new Booking({
        email: '  test@example.com  ',
        eventId: testEventId,
      });

      await expect(duplicateBooking.save()).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt on creation', async () => {
      const booking = await Booking.create({
        email: validBookingData.email,
        eventId: testEventId,
      });

      expect(booking.createdAt).toBeInstanceOf(Date);
      expect(booking.updatedAt).toBeInstanceOf(Date);
      expect(booking.createdAt.getTime()).toBeLessThanOrEqual(booking.updatedAt.getTime());
    });

    it('should update updatedAt when document is modified', async () => {
      const booking = await Booking.create({
        email: validBookingData.email,
        eventId: testEventId,
      });
      const originalUpdatedAt = booking.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Clean up potential duplicate before update
      await Booking.deleteMany({ email: 'updated@example.com', eventId: testEventId });
      
      booking.email = 'updated@example.com';
      await booking.save();

      expect(booking.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should not modify createdAt when document is updated', async () => {
      const booking = await Booking.create({
        email: validBookingData.email,
        eventId: testEventId,
      });
      const originalCreatedAt = booking.createdAt;

      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Clean up potential duplicate
      await Booking.deleteMany({ email: 'modified@example.com', eventId: testEventId });
      
      booking.email = 'modified@example.com';
      await booking.save();

      expect(booking.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe('Model Export and Reuse', () => {
    it('should use cached model on subsequent imports', () => {
      const Booking1 = mongoose.models.Booking;
      const Booking2 = require('@/database/booking.model').Booking;

      expect(Booking1).toBe(Booking2);
    });

    it('should query bookings successfully', async () => {
      await Booking.create({
        email: 'user1@example.com',
        eventId: testEventId,
      });
      await Booking.create({
        email: 'user2@example.com',
        eventId: testEventId,
      });

      const bookings = await Booking.find();
      expect(bookings).toHaveLength(2);
    });

    it('should find bookings by eventId', async () => {
      await Booking.create({
        email: 'user1@example.com',
        eventId: testEventId,
      });
      await Booking.create({
        email: 'user2@example.com',
        eventId: testEventId,
      });

      const bookings = await Booking.find({ eventId: testEventId });
      expect(bookings).toHaveLength(2);
    });

    it('should find booking by email', async () => {
      await Booking.create({
        email: validBookingData.email,
        eventId: testEventId,
      });

      const booking = await Booking.findOne({ email: validBookingData.email });
      expect(booking).toBeDefined();
      expect(booking?.email).toBe(validBookingData.email);
    });
  });

  describe('Population and References', () => {
    it('should populate event details', async () => {
      const booking = await Booking.create({
        email: validBookingData.email,
        eventId: testEventId,
      });

      const populatedBooking = await Booking.findById(booking._id).populate('eventId');
      
      expect(populatedBooking).toBeDefined();
      expect(populatedBooking?.eventId).toBeDefined();
      // Check if populated (will be object, not just ObjectId)
      expect(typeof populatedBooking?.eventId).toBe('object');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long email addresses', async () => {
      const longEmail = `${'a'.repeat(50)}@${'b'.repeat(50)}.com`;
      const booking = new Booking({
        email: longEmail,
        eventId: testEventId,
      });
      const savedBooking = await booking.save();

      expect(savedBooking.email).toBe(longEmail);
    });

    it('should handle email with subdomains', async () => {
      const booking = new Booking({
        email: 'user@mail.example.com',
        eventId: testEventId,
      });
      const savedBooking = await booking.save();

      expect(savedBooking.email).toBe('user@mail.example.com');
    });

    it('should handle email with numbers', async () => {
      const booking = new Booking({
        email: 'user123@example456.com',
        eventId: testEventId,
      });
      const savedBooking = await booking.save();

      expect(savedBooking.email).toBe('user123@example456.com');
    });

    it('should handle email with hyphens in domain', async () => {
      const booking = new Booking({
        email: 'user@my-domain.com',
        eventId: testEventId,
      });
      const savedBooking = await booking.save();

      expect(savedBooking.email).toBe('user@my-domain.com');
    });

    it('should handle multiple bookings for same event', async () => {
      const emails = ['user1@test.com', 'user2@test.com', 'user3@test.com'];
      
      for (const email of emails) {
        await Booking.create({ email, eventId: testEventId });
      }

      const bookings = await Booking.find({ eventId: testEventId });
      expect(bookings).toHaveLength(3);
    });

    it('should handle booking for event that gets deleted (cascade behavior)', async () => {
      const booking = await Booking.create({
        email: validBookingData.email,
        eventId: testEventId,
      });

      // Delete the event
      await Event.findByIdAndDelete(testEventId);

      // Booking still exists (no cascade delete configured)
      const foundBooking = await Booking.findById(booking._id);
      expect(foundBooking).toBeDefined();
    });
  });

  describe('Batch Operations', () => {
    it('should create multiple bookings efficiently', async () => {
      const bookings = [
        { email: 'user1@example.com', eventId: testEventId },
        { email: 'user2@example.com', eventId: testEventId },
        { email: 'user3@example.com', eventId: testEventId },
      ];

      const created = await Booking.insertMany(bookings);
      expect(created).toHaveLength(3);
    });

    it('should delete bookings for specific event', async () => {
      await Booking.create({ email: 'user1@example.com', eventId: testEventId });
      await Booking.create({ email: 'user2@example.com', eventId: testEventId });

      await Booking.deleteMany({ eventId: testEventId });

      const remaining = await Booking.find({ eventId: testEventId });
      expect(remaining).toHaveLength(0);
    });

    it('should count bookings for an event', async () => {
      await Booking.create({ email: 'user1@example.com', eventId: testEventId });
      await Booking.create({ email: 'user2@example.com', eventId: testEventId });
      await Booking.create({ email: 'user3@example.com', eventId: testEventId });

      const count = await Booking.countDocuments({ eventId: testEventId });
      expect(count).toBe(3);
    });
  });
});