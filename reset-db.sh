#!/bin/bash

# First run the drizzle push to ensure tables exist
echo "Pushing schema with drizzle-kit..."
npx drizzle-kit push

# Then reset and seed the database
echo "Resetting and seeding database..."
npx tsx scripts/reset-and-seed.ts

echo "Database reset and seed complete!"