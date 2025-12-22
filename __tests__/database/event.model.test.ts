import mongoose from 'mongoose';
import { Event, IEvent } from '@/database/event.model';

describe('Event Model', () => {
  const validEventData = {
    title: 'Tech Conference 2024',
    description: 'A conference about the latest in tech',
    overview: 'Join us for an exciting day of learning',
    image: 'https://example.com/image.jpg',
    venue: 'Convention Center',
    location: 'San Francisco, CA',
    date: new Date('2024-12-31'),
    time: '14:30',
    mode: 'In-Person',
    audience: 'Developers',
    agenda: ['Opening Keynote', 'Technical Sessions', 'Networking'],
    organizer: 'Tech Corp',
    tags: ['technology', 'conference', 'networking'],
  };

  describe('Event Creation - Happy Path', () => {
    it('should create a valid event with all required fields', async () => {
      const event = new Event(validEventData);
      const savedEvent = await event.save();

      expect(savedEvent._id).toBeDefined();
      expect(savedEvent.title).toBe(validEventData.title);
      expect(savedEvent.description).toBe(validEventData.description);
      expect(savedEvent.overview).toBe(validEventData.overview);
      expect(savedEvent.image).toBe(validEventData.image);
      expect(savedEvent.venue).toBe(validEventData.venue);
      expect(savedEvent.location).toBe(validEventData.location);
      expect(savedEvent.date).toEqual(validEventData.date);
      expect(savedEvent.time).toBe(validEventData.time);
      expect(savedEvent.mode).toBe(validEventData.mode);
      expect(savedEvent.audience).toBe(validEventData.audience);
      expect(savedEvent.agenda).toEqual(validEventData.agenda);
      expect(savedEvent.organizer).toBe(validEventData.organizer);
      expect(savedEvent.tags).toEqual(validEventData.tags);
      expect(savedEvent.createdAt).toBeDefined();
      expect(savedEvent.updatedAt).toBeDefined();
    });

    it('should auto-generate a unique slug from title', async () => {
      const event = new Event(validEventData);
      const savedEvent = await event.save();

      expect(savedEvent.slug).toBeDefined();
      expect(savedEvent.slug).toMatch(/^tech-conference-2024-[a-z0-9]+$/);
      expect(savedEvent.slug.startsWith('tech-conference-2024-')).toBe(true);
    });

    it('should create multiple events with unique slugs even with same title', async () => {
      const event1 = new Event(validEventData);
      const event2 = new Event(validEventData);

      const savedEvent1 = await event1.save();
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const savedEvent2 = await event2.save();

      expect(savedEvent1.slug).not.toBe(savedEvent2.slug);
      expect(savedEvent1.title).toBe(savedEvent2.title);
    });

    it('should normalize time format with leading zeros', async () => {
      const event = new Event({ ...validEventData, time: '9:05' });
      const savedEvent = await event.save();

      expect(savedEvent.time).toBe('09:05');
    });

    it('should accept time with already padded zeros', async () => {
      const event = new Event({ ...validEventData, time: '09:05' });
      const savedEvent = await event.save();

      expect(savedEvent.time).toBe('09:05');
    });

    it('should handle midnight time (00:00)', async () => {
      const event = new Event({ ...validEventData, time: '0:00' });
      const savedEvent = await event.save();

      expect(savedEvent.time).toBe('00:00');
    });

    it('should handle 23:59 time', async () => {
      const event = new Event({ ...validEventData, time: '23:59' });
      const savedEvent = await event.save();

      expect(savedEvent.time).toBe('23:59');
    });
  });

  describe('Slug Generation', () => {
    it('should convert title to lowercase in slug', async () => {
      const event = new Event({ ...validEventData, title: 'UPPERCASE EVENT' });
      const savedEvent = await event.save();

      expect(savedEvent.slug).toMatch(/^uppercase-event-[a-z0-9]+$/);
    });

    it('should replace spaces with hyphens in slug', async () => {
      const event = new Event({ ...validEventData, title: 'Multiple Word Title' });
      const savedEvent = await event.save();

      expect(savedEvent.slug).toMatch(/^multiple-word-title-[a-z0-9]+$/);
    });

    it('should remove special characters from slug', async () => {
      const event = new Event({ ...validEventData, title: 'Event@2024! & More...' });
      const savedEvent = await event.save();

      expect(savedEvent.slug).toMatch(/^event-2024-more-[a-z0-9]+$/);
      expect(savedEvent.slug).not.toContain('@');
      expect(savedEvent.slug).not.toContain('!');
      expect(savedEvent.slug).not.toContain('&');
      expect(savedEvent.slug).not.toContain('.');
    });

    it('should trim leading and trailing hyphens from slug', async () => {
      const event = new Event({ ...validEventData, title: '---Event---' });
      const savedEvent = await event.save();

      expect(savedEvent.slug).toMatch(/^event-[a-z0-9]+$/);
      expect(savedEvent.slug.startsWith('---')).toBe(false);
    });

    it('should handle title with only special characters', async () => {
      const event = new Event({ ...validEventData, title: '@@@ !!!' });
      const savedEvent = await event.save();

      expect(savedEvent.slug).toBeDefined();
      expect(savedEvent.slug).toMatch(/^[a-z0-9]+$/);
    });

    it('should regenerate slug when title is modified', async () => {
      const event = new Event(validEventData);
      const savedEvent = await event.save();
      const originalSlug = savedEvent.slug;

      await new Promise(resolve => setTimeout(resolve, 10));
      savedEvent.title = 'Updated Title';
      await savedEvent.save();

      expect(savedEvent.slug).not.toBe(originalSlug);
      expect(savedEvent.slug).toMatch(/^updated-title-[a-z0-9]+$/);
    });

    it('should not regenerate slug when title is not modified', async () => {
      const event = new Event(validEventData);
      const savedEvent = await event.save();
      const originalSlug = savedEvent.slug;

      savedEvent.description = 'Updated description';
      await savedEvent.save();

      expect(savedEvent.slug).toBe(originalSlug);
    });
  });

  describe('Time Validation', () => {
    it('should reject invalid time format (no colon)', async () => {
      const event = new Event({ ...validEventData, time: '1430' });

      await expect(event.save()).rejects.toThrow('Invalid time format. Expected HH:MM (24-hour).');
    });

    it('should reject invalid time format (too many colons)', async () => {
      const event = new Event({ ...validEventData, time: '14:30:00' });

      await expect(event.save()).rejects.toThrow('Invalid time format. Expected HH:MM (24-hour).');
    });

    it('should reject time with invalid hours (> 23)', async () => {
      const event = new Event({ ...validEventData, time: '24:00' });

      await expect(event.save()).rejects.toThrow('Invalid time value.');
    });

    it('should reject time with invalid hours (25)', async () => {
      const event = new Event({ ...validEventData, time: '25:30' });

      await expect(event.save()).rejects.toThrow('Invalid time value.');
    });

    it('should reject time with invalid minutes (> 59)', async () => {
      const event = new Event({ ...validEventData, time: '14:60' });

      await expect(event.save()).rejects.toThrow('Invalid time value.');
    });

    it('should reject time with invalid minutes (99)', async () => {
      const event = new Event({ ...validEventData, time: '14:99' });

      await expect(event.save()).rejects.toThrow('Invalid time value.');
    });

    it('should reject time with letters', async () => {
      const event = new Event({ ...validEventData, time: 'ab:cd' });

      await expect(event.save()).rejects.toThrow('Invalid time format. Expected HH:MM (24-hour).');
    });

    it('should reject time with single digit minutes', async () => {
      const event = new Event({ ...validEventData, time: '14:5' });

      await expect(event.save()).rejects.toThrow('Invalid time format. Expected HH:MM (24-hour).');
    });

    it('should accept single digit hours with two digit minutes', async () => {
      const event = new Event({ ...validEventData, time: '9:30' });
      const savedEvent = await event.save();

      expect(savedEvent.time).toBe('09:30');
    });

    it('should not re-validate time when updating other fields', async () => {
      const event = new Event(validEventData);
      const savedEvent = await event.save();

      savedEvent.description = 'Updated';
      await expect(savedEvent.save()).resolves.toBeDefined();
    });
  });

  describe('Required Field Validations', () => {
    it('should reject event without title', async () => {
      const event = new Event({ ...validEventData, title: undefined as any });

      await expect(event.save()).rejects.toThrow();
    });

    it('should reject event with empty title', async () => {
      const event = new Event({ ...validEventData, title: '' });

      await expect(event.save()).rejects.toThrow();
    });

    it('should reject event without description', async () => {
      const event = new Event({ ...validEventData, description: undefined as any });

      await expect(event.save()).rejects.toThrow();
    });

    it('should reject event without overview', async () => {
      const event = new Event({ ...validEventData, overview: undefined as any });

      await expect(event.save()).rejects.toThrow();
    });

    it('should reject event without image', async () => {
      const event = new Event({ ...validEventData, image: undefined as any });

      await expect(event.save()).rejects.toThrow();
    });

    it('should reject event without venue', async () => {
      const event = new Event({ ...validEventData, venue: undefined as any });

      await expect(event.save()).rejects.toThrow();
    });

    it('should reject event without location', async () => {
      const event = new Event({ ...validEventData, location: undefined as any });

      await expect(event.save()).rejects.toThrow();
    });

    it('should reject event without date', async () => {
      const event = new Event({ ...validEventData, date: undefined as any });

      await expect(event.save()).rejects.toThrow();
    });

    it('should reject event without time', async () => {
      const event = new Event({ ...validEventData, time: undefined as any });

      await expect(event.save()).rejects.toThrow();
    });

    it('should reject event without mode', async () => {
      const event = new Event({ ...validEventData, mode: undefined as any });

      await expect(event.save()).rejects.toThrow();
    });

    it('should reject event without audience', async () => {
      const event = new Event({ ...validEventData, audience: undefined as any });

      await expect(event.save()).rejects.toThrow();
    });

    it('should reject event without organizer', async () => {
      const event = new Event({ ...validEventData, organizer: undefined as any });

      await expect(event.save()).rejects.toThrow();
    });
  });

  describe('Agenda Field Validation', () => {
    it('should accept valid agenda array', async () => {
      const event = new Event(validEventData);
      const savedEvent = await event.save();

      expect(savedEvent.agenda).toEqual(validEventData.agenda);
    });

    it('should reject empty agenda array', async () => {
      const event = new Event({ ...validEventData, agenda: [] });

      await expect(event.save()).rejects.toThrow('Agenda must be a non-empty array of non-empty strings.');
    });

    it('should reject agenda with empty strings', async () => {
      const event = new Event({ ...validEventData, agenda: ['Item 1', '', 'Item 3'] });

      await expect(event.save()).rejects.toThrow('Agenda must be a non-empty array of non-empty strings.');
    });

    it('should reject agenda with whitespace-only strings', async () => {
      const event = new Event({ ...validEventData, agenda: ['Item 1', '   ', 'Item 3'] });

      await expect(event.save()).rejects.toThrow('Agenda must be a non-empty array of non-empty strings.');
    });

    it('should reject non-array agenda', async () => {
      const event = new Event({ ...validEventData, agenda: 'not an array' as any });

      await expect(event.save()).rejects.toThrow();
    });

    it('should accept single-item agenda', async () => {
      const event = new Event({ ...validEventData, agenda: ['Single Item'] });
      const savedEvent = await event.save();

      expect(savedEvent.agenda).toEqual(['Single Item']);
    });
  });

  describe('Tags Field Validation', () => {
    it('should accept valid tags array', async () => {
      const event = new Event(validEventData);
      const savedEvent = await event.save();

      expect(savedEvent.tags).toEqual(validEventData.tags);
    });

    it('should reject empty tags array', async () => {
      const event = new Event({ ...validEventData, tags: [] });

      await expect(event.save()).rejects.toThrow('Tags must be a non-empty array of non-empty strings.');
    });

    it('should reject tags with empty strings', async () => {
      const event = new Event({ ...validEventData, tags: ['tag1', '', 'tag3'] });

      await expect(event.save()).rejects.toThrow('Tags must be a non-empty array of non-empty strings.');
    });

    it('should reject tags with whitespace-only strings', async () => {
      const event = new Event({ ...validEventData, tags: ['tag1', '  ', 'tag3'] });

      await expect(event.save()).rejects.toThrow('Tags must be a non-empty array of non-empty strings.');
    });

    it('should reject non-array tags', async () => {
      const event = new Event({ ...validEventData, tags: 'not an array' as any });

      await expect(event.save()).rejects.toThrow();
    });

    it('should accept single-item tags', async () => {
      const event = new Event({ ...validEventData, tags: ['solo-tag'] });
      const savedEvent = await event.save();

      expect(savedEvent.tags).toEqual(['solo-tag']);
    });
  });

  describe('String Trimming', () => {
    it('should trim whitespace from title', async () => {
      const event = new Event({ ...validEventData, title: '  Trimmed Title  ' });
      const savedEvent = await event.save();

      expect(savedEvent.title).toBe('Trimmed Title');
    });

    it('should trim whitespace from description', async () => {
      const event = new Event({ ...validEventData, description: '  Trimmed Desc  ' });
      const savedEvent = await event.save();

      expect(savedEvent.description).toBe('Trimmed Desc');
    });

    it('should trim whitespace from overview', async () => {
      const event = new Event({ ...validEventData, overview: '  Trimmed Overview  ' });
      const savedEvent = await event.save();

      expect(savedEvent.overview).toBe('Trimmed Overview');
    });

    it('should trim whitespace from image', async () => {
      const event = new Event({ ...validEventData, image: '  http://example.com/img.jpg  ' });
      const savedEvent = await event.save();

      expect(savedEvent.image).toBe('http://example.com/img.jpg');
    });

    it('should trim whitespace from venue', async () => {
      const event = new Event({ ...validEventData, venue: '  Trimmed Venue  ' });
      const savedEvent = await event.save();

      expect(savedEvent.venue).toBe('Trimmed Venue');
    });

    it('should trim whitespace from location', async () => {
      const event = new Event({ ...validEventData, location: '  Trimmed Location  ' });
      const savedEvent = await event.save();

      expect(savedEvent.location).toBe('Trimmed Location');
    });

    it('should trim whitespace from time', async () => {
      const event = new Event({ ...validEventData, time: '  14:30  ' });
      const savedEvent = await event.save();

      expect(savedEvent.time).toBe('14:30');
    });

    it('should trim whitespace from mode', async () => {
      const event = new Event({ ...validEventData, mode: '  Online  ' });
      const savedEvent = await event.save();

      expect(savedEvent.mode).toBe('Online');
    });

    it('should trim whitespace from audience', async () => {
      const event = new Event({ ...validEventData, audience: '  Students  ' });
      const savedEvent = await event.save();

      expect(savedEvent.audience).toBe('Students');
    });

    it('should trim whitespace from organizer', async () => {
      const event = new Event({ ...validEventData, organizer: '  Trimmed Org  ' });
      const savedEvent = await event.save();

      expect(savedEvent.organizer).toBe('Trimmed Org');
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt on creation', async () => {
      const event = new Event(validEventData);
      const savedEvent = await event.save();

      expect(savedEvent.createdAt).toBeInstanceOf(Date);
      expect(savedEvent.updatedAt).toBeInstanceOf(Date);
      expect(savedEvent.createdAt.getTime()).toBeLessThanOrEqual(savedEvent.updatedAt.getTime());
    });

    it('should update updatedAt when document is modified', async () => {
      const event = new Event(validEventData);
      const savedEvent = await event.save();
      const originalUpdatedAt = savedEvent.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));
      savedEvent.description = 'Updated description';
      await savedEvent.save();

      expect(savedEvent.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should not modify createdAt when document is updated', async () => {
      const event = new Event(validEventData);
      const savedEvent = await event.save();
      const originalCreatedAt = savedEvent.createdAt;

      await new Promise(resolve => setTimeout(resolve, 10));
      savedEvent.description = 'Updated description';
      await savedEvent.save();

      expect(savedEvent.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe('Model Export and Reuse', () => {
    it('should use cached model on subsequent imports', () => {
      const Event1 = mongoose.models.Event;
      const Event2 = require('@/database/event.model').Event;

      expect(Event1).toBe(Event2);
    });

    it('should query events successfully', async () => {
      await new Event(validEventData).save();
      await new Event({ ...validEventData, title: 'Second Event' }).save();

      const events = await Event.find();
      expect(events).toHaveLength(2);
    });

    it('should find event by slug', async () => {
      const savedEvent = await new Event(validEventData).save();

      const foundEvent = await Event.findOne({ slug: savedEvent.slug });
      expect(foundEvent).toBeDefined();
      expect(foundEvent?.title).toBe(validEventData.title);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long title', async () => {
      const longTitle = 'A'.repeat(1000);
      const event = new Event({ ...validEventData, title: longTitle });
      const savedEvent = await event.save();

      expect(savedEvent.title).toBe(longTitle);
    });

    it('should handle date in the past', async () => {
      const pastDate = new Date('2020-01-01');
      const event = new Event({ ...validEventData, date: pastDate });
      const savedEvent = await event.save();

      expect(savedEvent.date).toEqual(pastDate);
    });

    it('should handle date far in the future', async () => {
      const futureDate = new Date('2099-12-31');
      const event = new Event({ ...validEventData, date: futureDate });
      const savedEvent = await event.save();

      expect(savedEvent.date).toEqual(futureDate);
    });

    it('should handle agenda with many items', async () => {
      const manyItems = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`);
      const event = new Event({ ...validEventData, agenda: manyItems });
      const savedEvent = await event.save();

      expect(savedEvent.agenda).toHaveLength(100);
    });

    it('should handle tags with many items', async () => {
      const manyTags = Array.from({ length: 50 }, (_, i) => `tag${i + 1}`);
      const event = new Event({ ...validEventData, tags: manyTags });
      const savedEvent = await event.save();

      expect(savedEvent.tags).toHaveLength(50);
    });

    it('should handle special characters in various fields', async () => {
      const event = new Event({
        ...validEventData,
        description: 'Description with émojis 🎉 and spëcial çhars',
        overview: 'Overview with 中文 characters',
        organizer: 'Org with © ® ™ symbols',
      });
      const savedEvent = await event.save();

      expect(savedEvent.description).toContain('🎉');
      expect(savedEvent.overview).toContain('中文');
      expect(savedEvent.organizer).toContain('©');
    });
  });
});