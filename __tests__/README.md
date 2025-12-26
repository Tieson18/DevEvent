# DevEvent Test Suite

Comprehensive unit tests for the DevEvent application.

## Running Tests

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

## Test Files

- `__tests__/database/event.model.test.ts` - Event model tests
- `__tests__/database/booking.model.test.ts` - Booking model tests  
- `__tests__/database/index.test.ts` - Database index tests
- `__tests__/lib/mongodb.test.ts` - MongoDB connection tests

## Setup

Tests use Jest with MongoDB Memory Server for isolated testing.