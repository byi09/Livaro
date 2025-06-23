import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';


// Use the direct connection string
const DATABASE_URL = 'postgresql://postgres.nupscwvvnvqarggymojg:rentoraindia@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

// For migrations
const migrationClient = postgres(DATABASE_URL, { max: 1 });

// For seeding
const seedClient = postgres(DATABASE_URL);
const db = drizzle(seedClient, { schema });

async function cleanupDatabase(db: ReturnType<typeof drizzle>) {
  console.log('🧹 Cleaning up existing data...');
  
  // Delete in reverse order of dependencies
  // Messaging data
  await db.delete(schema.groupInvitations);
  await db.delete(schema.messages);
  await db.delete(schema.conversationParticipants);
  await db.delete(schema.conversations);
  
  // Property and rental data
  await db.delete(schema.propertyFeatures);
  await db.delete(schema.propertyListings);
  await db.delete(schema.properties);
  await db.delete(schema.neighborhoods);
  await db.delete(schema.renters);
  await db.delete(schema.landlords);
  await db.delete(schema.customers);
  await db.delete(schema.users);
  
  console.log('✅ Database cleanup completed');
}

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // First, run any pending migrations
    console.log('Running migrations...');
   
    console.log('Migrations completed!');

    // Clean up existing data
    await cleanupDatabase(db);

    // Then seed the database
    console.log('Seeding database...');
    
    // 1. Create sample users
    const sampleUsers = await db.insert(schema.users).values([
      {
        id: 'e7393998-e2e6-4e45-b13e-5c522a474ef8', // Specified user UUID
        email: 'test.user@example.com',
        username: 'test_user',
        emailVerified: true,
        accountStatus: 'active',
      },
      {
        email: 'john.renter@example.com',
        username: 'john_renter',
        emailVerified: true,
        accountStatus: 'active',
      },
      {
        email: 'sarah.landlord@example.com',
        username: 'sarah_landlord',
        emailVerified: true,
        accountStatus: 'active',
      },
      {
        email: 'mike.owner@example.com',
        username: 'mike_owner',
        emailVerified: true,
        accountStatus: 'active',
      },
      {
        email: 'emma.renter@example.com',
        username: 'emma_renter',
        emailVerified: true,
        accountStatus: 'active',
      },
      {
        email: 'david.landlord@example.com',
        username: 'david_landlord',
        emailVerified: true,
        accountStatus: 'active',
      }
    ]).returning();

    console.log(`✅ Created ${sampleUsers.length} users`);

    // 2. Create customer profiles
    const sampleCustomers = await db.insert(schema.customers).values([
      {
        userId: sampleUsers[0].id, // test_user (e7393998-e2e6-4e45-b13e-5c522a474ef8)
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1-555-0100',
        currentCity: 'San Francisco',
        currentState: 'CA',
        currentZipCode: '94105'
      },
      {
        userId: sampleUsers[1].id,
        firstName: 'John',
        lastName: 'Smith',
        phoneNumber: '+1-555-0101',
        currentCity: 'San Francisco',
        currentState: 'CA',
        currentZipCode: '94102'
      },
      {
        userId: sampleUsers[2].id,
        firstName: 'Sarah',
        lastName: 'Johnson',
        phoneNumber: '+1-555-0102',
        currentCity: 'San Francisco',
        currentState: 'CA',
        currentZipCode: '94103'
      },
      {
        userId: sampleUsers[3].id,
        firstName: 'Mike',
        lastName: 'Davis',
        phoneNumber: '+1-555-0103',
        currentCity: 'Oakland',
        currentState: 'CA',
        currentZipCode: '94601'
      },
      {
        userId: sampleUsers[4].id,
        firstName: 'Emma',
        lastName: 'Wilson',
        phoneNumber: '+1-555-0104',
        currentCity: 'Berkeley',
        currentState: 'CA',
        currentZipCode: '94704'
      },
      {
        userId: sampleUsers[5].id,
        firstName: 'David',
        lastName: 'Chen',
        phoneNumber: '+1-555-0105',
        currentCity: 'Palo Alto',
        currentState: 'CA',
        currentZipCode: '94301'
      }
    ]).returning();

    console.log(`✅ Created ${sampleCustomers.length} customer profiles`);

    // 3. Create landlords
    const sampleLandlords = await db.insert(schema.landlords).values([
      {
        customerId: sampleCustomers[2].id, // Sarah
        businessName: 'Johnson Properties LLC',
        acceptsPets: true,
        allowsSmoking: false,
        minimumCreditScore: 650,
        minimumIncomeMultiplier: '3.0',
        businessEmail: 'sarah@johnsonproperties.com',
        identityVerified: true
      },
      {
        customerId: sampleCustomers[3].id, // Mike
        businessName: 'Oakland Rentals',
        acceptsPets: true,
        allowsSmoking: false,
        minimumCreditScore: 600,
        minimumIncomeMultiplier: '2.5',
        businessEmail: 'mike@oaklandrentals.com',
        identityVerified: true
      },
      {
        customerId: sampleCustomers[5].id, // David
        businessName: 'Peninsula Properties',
        acceptsPets: false,
        allowsSmoking: false,
        minimumCreditScore: 700,
        minimumIncomeMultiplier: '3.5',
        businessEmail: 'david@peninsulaprops.com',
        identityVerified: true
      }
    ]).returning();

    console.log(`✅ Created ${sampleLandlords.length} landlords`);

    // 4. Create renters
    const sampleRenters = await db.insert(schema.renters).values([
      {
        customerId: sampleCustomers[0].id, // Test User
        monthlyBudget: '4000.00',
        moveInTimeline: '1_month',
        currentRent: '3200.00',
        reasonForMoving: 'Looking for a better place',
        petsCount: 0,
        employmentStatus: 'employed',
        monthlyIncome: '10000.00',
        employer: 'Tech Startup',
        hasRentalHistory: true
      },
      {
        customerId: sampleCustomers[1].id, // John
        monthlyBudget: '3500.00',
        moveInTimeline: '2_months',
        currentRent: '2800.00',
        reasonForMoving: 'Need more space',
        petsCount: 1,
        petTypes: 'dog',
        employmentStatus: 'employed',
        monthlyIncome: '8500.00',
        employer: 'Tech Corp',
        hasRentalHistory: true
      },
      {
        customerId: sampleCustomers[4].id, // Emma
        monthlyBudget: '2800.00',
        moveInTimeline: '1_month',
        currentRent: '2200.00',
        reasonForMoving: 'Job relocation',
        petsCount: 0,
        employmentStatus: 'employed',
        monthlyIncome: '7200.00',
        employer: 'Design Studio',
        hasRentalHistory: true
      }
    ]).returning();

    console.log(`✅ Created ${sampleRenters.length} renters`);

    // 5. Create neighborhoods
    const sampleNeighborhoods = await db.insert(schema.neighborhoods).values([
      {
        name: 'Mission District',
        city: 'San Francisco',
        state: 'CA',
        zipCodes: JSON.stringify(['94110', '94103']),
        averageRent: '3200.00',
        medianRent: '3000.00',
        walkScore: 89,
        transitScore: 85,
        bikeScore: 77,
        crimeRating: '6.5',
        schoolRating: '7.2',
        nightlifeRating: '9.1',
        diningRating: '8.8'
      },
      {
        name: 'SOMA',
        city: 'San Francisco',
        state: 'CA',
        zipCodes: JSON.stringify(['94103', '94107']),
        averageRent: '4100.00',
        medianRent: '3900.00',
        walkScore: 95,
        transitScore: 90,
        bikeScore: 82,
        crimeRating: '6.8',
        schoolRating: '6.9',
        nightlifeRating: '8.5',
        diningRating: '8.2'
      },
      {
        name: 'Temescal',
        city: 'Oakland',
        state: 'CA',
        zipCodes: JSON.stringify(['94608', '94609']),
        averageRent: '2400.00',
        medianRent: '2200.00',
        walkScore: 78,
        transitScore: 65,
        bikeScore: 71,
        crimeRating: '7.2',
        schoolRating: '7.8',
        nightlifeRating: '7.5',
        diningRating: '8.1'
      }
    ]).returning();

    console.log(`✅ Created ${sampleNeighborhoods.length} neighborhoods`);

    // 6. Create properties
    const sampleProperties = await db.insert(schema.properties).values([
      // Mission District Properties
      {
        landlordId: sampleLandlords[0].id,
        addressLine1: '123 Valencia Street',
        addressLine2: 'Unit 4A',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94110',
        latitude: '37.7599',
        longitude: '-122.4204',
        propertyType: 'apartment',
        yearBuilt: 1920,
        squareFootage: 850,
        bedrooms: 1,
        bathrooms: '1.0',
        parkingSpaces: 0,
        hasBasement: false,
        hasAttic: false,
        propertyStatus: 'available',
        description: 'Charming 1-bedroom apartment in the heart of Mission District with original hardwood floors and high ceilings.'
      },
      {
        landlordId: sampleLandlords[0].id,
        addressLine1: '456 Folsom Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94103',
        latitude: '37.7881',
        longitude: '-122.3972',
        propertyType: 'condo',
        yearBuilt: 2018,
        squareFootage: 1200,
        bedrooms: 2,
        bathrooms: '2.0',
        parkingSpaces: 1,
        garageSpaces: 1,
        hasBasement: false,
        hasAttic: false,
        propertyStatus: 'available',
        description: 'Modern 2-bedroom condo in SOMA with city views, in-unit laundry, and garage parking.'
      },
      // Oakland Properties
      {
        landlordId: sampleLandlords[1].id,
        addressLine1: '789 Telegraph Avenue',
        city: 'Oakland',
        state: 'CA',
        zipCode: '94609',
        latitude: '37.8272',
        longitude: '-122.2633',
        propertyType: 'house',
        yearBuilt: 1925,
        squareFootage: 1800,
        lotSize: '4500.00',
        bedrooms: 3,
        bathrooms: '2.0',
        halfBathrooms: 1,
        parkingSpaces: 2,
        hasBasement: true,
        hasAttic: true,
        propertyStatus: 'available',
        description: 'Spacious Victorian house in Temescal with large yard, perfect for families or roommates.'
      },
      {
        landlordId: sampleLandlords[1].id,
        addressLine1: '654 Grand Avenue',
        city: 'Oakland',
        state: 'CA',
        zipCode: '94610',
        latitude: '37.8044',
        longitude: '-122.2712',
        propertyType: 'apartment',
        yearBuilt: 1960,
        squareFootage: 650,
        bedrooms: 0,
        bathrooms: '1.0',
        parkingSpaces: 1,
        hasBasement: false,
        hasAttic: false,
        propertyStatus: 'available',
        description: 'Cozy studio apartment with lake views and vintage charm near Lake Merritt.'
      },
      // Palo Alto Properties
      {
        landlordId: sampleLandlords[2].id,
        addressLine1: '321 University Avenue',
        city: 'Palo Alto',
        state: 'CA',
        zipCode: '94301',
        latitude: '37.4419',
        longitude: '-122.1430',
        propertyType: 'townhouse',
        yearBuilt: 2010,
        squareFootage: 1500,
        bedrooms: 2,
        bathrooms: '2.5',
        parkingSpaces: 2,
        garageSpaces: 2,
        hasBasement: false,
        hasAttic: false,
        propertyStatus: 'available',
        description: 'Contemporary townhouse near Stanford with attached garage and modern amenities.'
      },
      // Additional San Francisco Properties
      {
        landlordId: sampleLandlords[0].id,
        addressLine1: '789 Market Street',
        addressLine2: 'Unit 1502',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94103',
        latitude: '37.7855',
        longitude: '-122.4067',
        propertyType: 'condo',
        yearBuilt: 2015,
        squareFootage: 1100,
        bedrooms: 1,
        bathrooms: '1.5',
        parkingSpaces: 1,
        hasBasement: false,
        hasAttic: false,
        propertyStatus: 'available',
        description: 'Luxury high-rise condo with panoramic city views, modern finishes, and building amenities.'
      },
      {
        landlordId: sampleLandlords[0].id,
        addressLine1: '456 Hayes Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        latitude: '37.7767',
        longitude: '-122.4267',
        propertyType: 'apartment',
        yearBuilt: 1930,
        squareFootage: 950,
        bedrooms: 2,
        bathrooms: '1.0',
        parkingSpaces: 0,
        hasBasement: false,
        hasAttic: true,
        propertyStatus: 'available',
        description: 'Charming 2-bedroom apartment in Hayes Valley with original details and great location.'
      },
      // Additional Oakland Properties
      {
        landlordId: sampleLandlords[1].id,
        addressLine1: '123 Lakeshore Avenue',
        city: 'Oakland',
        state: 'CA',
        zipCode: '94610',
        latitude: '37.8044',
        longitude: '-122.2712',
        propertyType: 'apartment',
        yearBuilt: 1970,
        squareFootage: 800,
        bedrooms: 1,
        bathrooms: '1.0',
        parkingSpaces: 1,
        hasBasement: false,
        hasAttic: false,
        propertyStatus: 'available',
        description: 'Bright 1-bedroom apartment with lake views and updated kitchen.'
      },
      {
        landlordId: sampleLandlords[1].id,
        addressLine1: '789 Piedmont Avenue',
        city: 'Oakland',
        state: 'CA',
        zipCode: '94611',
        latitude: '37.8272',
        longitude: '-122.2633',
        propertyType: 'house',
        yearBuilt: 1950,
        squareFootage: 1600,
        bedrooms: 3,
        bathrooms: '2.0',
        parkingSpaces: 2,
        hasBasement: true,
        hasAttic: false,
        propertyStatus: 'available',
        description: 'Mid-century modern home in Piedmont with updated kitchen and large backyard.'
      },
      // Additional Palo Alto Properties
      {
        landlordId: sampleLandlords[2].id,
        addressLine1: '456 California Avenue',
        city: 'Palo Alto',
        state: 'CA',
        zipCode: '94306',
        latitude: '37.4419',
        longitude: '-122.1430',
        propertyType: 'apartment',
        yearBuilt: 2000,
        squareFootage: 900,
        bedrooms: 1,
        bathrooms: '1.0',
        parkingSpaces: 1,
        hasBasement: false,
        hasAttic: false,
        propertyStatus: 'available',
        description: 'Modern 1-bedroom apartment near California Avenue with community amenities.'
      }
    ]).returning();

    console.log(`✅ Created ${sampleProperties.length} properties`);

    // 7. Create property listings
    const sampleListings = await db.insert(schema.propertyListings).values([
      {
        propertyId: sampleProperties[0].id,
        monthlyRent: '2950.00',
        securityDeposit: '2950.00',
        applicationFee: '75.00',
        minimumLeaseTerm: 12,
        maximumLeaseTerm: 24,
        availableDate: '2024-03-01',
        utilitiesIncluded: JSON.stringify(['water', 'garbage']),
        listingStatus: 'active',
        listingTitle: 'Charming Mission District 1BR',
        listingDescription: 'Perfect for young professionals, this bright apartment features original details with modern updates.',
        viewCount: 47
      },
      {
        propertyId: sampleProperties[1].id,
        monthlyRent: '4200.00',
        securityDeposit: '4200.00',
        petDeposit: '500.00',
        applicationFee: '100.00',
        minimumLeaseTerm: 12,
        maximumLeaseTerm: 36,
        availableDate: '2024-02-15',
        utilitiesIncluded: JSON.stringify(['water', 'garbage', 'internet']),
        parkingCost: '250.00',
        listingStatus: 'active',
        listingTitle: 'Luxury SOMA Condo with Parking',
        listingDescription: 'High-end finishes, rooftop deck access, and prime location near tech companies.',
        viewCount: 83
      },
      {
        propertyId: sampleProperties[2].id,
        monthlyRent: '3200.00',
        securityDeposit: '3200.00',
        petDeposit: '300.00',
        applicationFee: '50.00',
        minimumLeaseTerm: 12,
        maximumLeaseTerm: 24,
        availableDate: '2024-04-01',
        utilitiesIncluded: JSON.stringify(['water', 'garbage']),
        listingStatus: 'active',
        listingTitle: 'Victorian House in Temescal',
        listingDescription: 'Character-filled home with original features, large yard, and great neighborhood vibes.',
        viewCount: 62
      },
      {
        propertyId: sampleProperties[3].id,
        monthlyRent: '1850.00',
        securityDeposit: '1850.00',
        applicationFee: '50.00',
        minimumLeaseTerm: 6,
        maximumLeaseTerm: 12,
        availableDate: '2024-02-01',
        utilitiesIncluded: JSON.stringify(['water', 'garbage', 'electricity']),
        listingStatus: 'active',
        listingTitle: 'Lake Merritt Studio with Views',
        listingDescription: 'Affordable studio with character and amazing lake views. Perfect for first-time renters.',
        viewCount: 31
      },
      {
        propertyId: sampleProperties[4].id,
        monthlyRent: '5800.00',
        securityDeposit: '8700.00',
        applicationFee: '150.00',
        minimumLeaseTerm: 12,
        maximumLeaseTerm: 24,
        availableDate: '2024-03-15',
        utilitiesIncluded: JSON.stringify(['water', 'garbage']),
        listingStatus: 'active',
        listingTitle: 'Modern Palo Alto Townhouse',
        listingDescription: 'Walking distance to Stanford, tech companies, and downtown Palo Alto amenities.',
        viewCount: 95
      },
      {
        propertyId: sampleProperties[5].id,
        monthlyRent: '4500.00',
        securityDeposit: '4500.00',
        applicationFee: '100.00',
        minimumLeaseTerm: 12,
        maximumLeaseTerm: 24,
        availableDate: '2024-03-01',
        utilitiesIncluded: JSON.stringify(['water', 'garbage', 'internet', 'electricity']),
        listingStatus: 'active',
        listingTitle: 'Luxury High-Rise Condo with City Views',
        listingDescription: 'Stunning views, modern amenities, and prime location in the heart of the city.',
        viewCount: 120
      },
      {
        propertyId: sampleProperties[6].id,
        monthlyRent: '3200.00',
        securityDeposit: '3200.00',
        applicationFee: '75.00',
        minimumLeaseTerm: 12,
        maximumLeaseTerm: 24,
        availableDate: '2024-02-15',
        utilitiesIncluded: JSON.stringify(['water', 'garbage']),
        listingStatus: 'active',
        listingTitle: 'Charming Hayes Valley 2BR',
        listingDescription: 'Historic building with modern updates in one of SF\'s most desirable neighborhoods.',
        viewCount: 78
      },
      {
        propertyId: sampleProperties[7].id,
        monthlyRent: '2100.00',
        securityDeposit: '2100.00',
        applicationFee: '50.00',
        minimumLeaseTerm: 12,
        maximumLeaseTerm: 24,
        availableDate: '2024-03-01',
        utilitiesIncluded: JSON.stringify(['water', 'garbage']),
        listingStatus: 'active',
        listingTitle: 'Lake Merritt 1BR with Views',
        listingDescription: 'Bright apartment with lake views and updated kitchen.',
        viewCount: 45
      },
      {
        propertyId: sampleProperties[8].id,
        monthlyRent: '3800.00',
        securityDeposit: '3800.00',
        applicationFee: '75.00',
        minimumLeaseTerm: 12,
        maximumLeaseTerm: 24,
        availableDate: '2024-04-01',
        utilitiesIncluded: JSON.stringify(['water', 'garbage']),
        listingStatus: 'active',
        listingTitle: 'Mid-Century Modern in Piedmont',
        listingDescription: 'Beautiful home with updated kitchen and large backyard.',
        viewCount: 89
      },
      {
        propertyId: sampleProperties[9].id,
        monthlyRent: '2800.00',
        securityDeposit: '2800.00',
        applicationFee: '75.00',
        minimumLeaseTerm: 12,
        maximumLeaseTerm: 24,
        availableDate: '2024-03-01',
        utilitiesIncluded: JSON.stringify(['water', 'garbage', 'internet']),
        listingStatus: 'active',
        listingTitle: 'Modern California Ave Apartment',
        listingDescription: 'Contemporary apartment with community amenities in a great location.',
        viewCount: 52
      }
    ]).returning();

    console.log(`✅ Created ${sampleListings.length} property listings`);

    // Add property features
    const sampleFeatures = await db.insert(schema.propertyFeatures).values([
      // Mission District Apartment (Property 0)
      { propertyId: sampleProperties[0].id, featureName: 'Hardwood Floors', featureCategory: 'interior' },
      { propertyId: sampleProperties[0].id, featureName: 'High Ceilings', featureCategory: 'interior' },
      { propertyId: sampleProperties[0].id, featureName: 'Updated Kitchen', featureCategory: 'interior' },
      { propertyId: sampleProperties[0].id, featureName: 'In-Unit Laundry', featureCategory: 'appliances' },
      { propertyId: sampleProperties[0].id, featureName: 'Dishwasher', featureCategory: 'appliances' },
      
      // SOMA Condo (Property 1)
      { propertyId: sampleProperties[1].id, featureName: 'In-Unit Laundry', featureCategory: 'appliances' },
      { propertyId: sampleProperties[1].id, featureName: 'City Views', featureCategory: 'interior' },
      { propertyId: sampleProperties[1].id, featureName: 'Rooftop Deck', featureCategory: 'building_amenities' },
      { propertyId: sampleProperties[1].id, featureName: 'Stainless Steel Appliances', featureCategory: 'appliances' },
      { propertyId: sampleProperties[1].id, featureName: 'Central AC/Heat', featureCategory: 'utilities' },
      { propertyId: sampleProperties[1].id, featureName: 'Garage Parking', featureCategory: 'building_amenities' },
      
      // Temescal House (Property 2)
      { propertyId: sampleProperties[2].id, featureName: 'Large Yard', featureCategory: 'exterior' },
      { propertyId: sampleProperties[2].id, featureName: 'Original Details', featureCategory: 'interior' },
      { propertyId: sampleProperties[2].id, featureName: 'Pet Friendly', featureCategory: 'building_amenities' },
      { propertyId: sampleProperties[2].id, featureName: 'Storage Space', featureCategory: 'interior' },
      { propertyId: sampleProperties[2].id, featureName: 'Fireplace', featureCategory: 'interior' },
      { propertyId: sampleProperties[2].id, featureName: 'Garden', featureCategory: 'exterior' },
      
      // Lake Merritt Studio (Property 3)
      { propertyId: sampleProperties[3].id, featureName: 'Lake Views', featureCategory: 'interior' },
      { propertyId: sampleProperties[3].id, featureName: 'Vintage Charm', featureCategory: 'interior' },
      { propertyId: sampleProperties[3].id, featureName: 'Updated Kitchen', featureCategory: 'interior' },
      { propertyId: sampleProperties[3].id, featureName: 'Parking Space', featureCategory: 'building_amenities' },
      
      // Palo Alto Townhouse (Property 4)
      { propertyId: sampleProperties[4].id, featureName: 'Attached Garage', featureCategory: 'exterior' },
      { propertyId: sampleProperties[4].id, featureName: 'Modern Finishes', featureCategory: 'interior' },
      { propertyId: sampleProperties[4].id, featureName: 'Central AC/Heat', featureCategory: 'utilities' },
      { propertyId: sampleProperties[4].id, featureName: 'Private Patio', featureCategory: 'exterior' },
      { propertyId: sampleProperties[4].id, featureName: 'Smart Home Features', featureCategory: 'utilities' },
      
      // Market Street Condo (Property 5)
      { propertyId: sampleProperties[5].id, featureName: 'City Views', featureCategory: 'interior' },
      { propertyId: sampleProperties[5].id, featureName: 'Concierge', featureCategory: 'building_amenities' },
      { propertyId: sampleProperties[5].id, featureName: 'Fitness Center', featureCategory: 'building_amenities' },
      { propertyId: sampleProperties[5].id, featureName: 'Rooftop Deck', featureCategory: 'building_amenities' },
      { propertyId: sampleProperties[5].id, featureName: 'Stainless Steel Appliances', featureCategory: 'appliances' },
      { propertyId: sampleProperties[5].id, featureName: 'Central AC/Heat', featureCategory: 'utilities' },
      
      // Hayes Valley Apartment (Property 6)
      { propertyId: sampleProperties[6].id, featureName: 'Hardwood Floors', featureCategory: 'interior' },
      { propertyId: sampleProperties[6].id, featureName: 'Original Details', featureCategory: 'interior' },
      { propertyId: sampleProperties[6].id, featureName: 'Updated Kitchen', featureCategory: 'interior' },
      { propertyId: sampleProperties[6].id, featureName: 'Storage Space', featureCategory: 'interior' },
      { propertyId: sampleProperties[6].id, featureName: 'Fireplace', featureCategory: 'interior' },
      
      // Lakeshore Apartment (Property 7)
      { propertyId: sampleProperties[7].id, featureName: 'Lake Views', featureCategory: 'interior' },
      { propertyId: sampleProperties[7].id, featureName: 'Updated Kitchen', featureCategory: 'interior' },
      { propertyId: sampleProperties[7].id, featureName: 'Dishwasher', featureCategory: 'appliances' },
      { propertyId: sampleProperties[7].id, featureName: 'Parking Space', featureCategory: 'building_amenities' },
      { propertyId: sampleProperties[7].id, featureName: 'In-Unit Laundry', featureCategory: 'appliances' },
      
      // Piedmont House (Property 8)
      { propertyId: sampleProperties[8].id, featureName: 'Updated Kitchen', featureCategory: 'interior' },
      { propertyId: sampleProperties[8].id, featureName: 'Large Backyard', featureCategory: 'exterior' },
      { propertyId: sampleProperties[8].id, featureName: 'Garage', featureCategory: 'exterior' },
      { propertyId: sampleProperties[8].id, featureName: 'Fireplace', featureCategory: 'interior' },
      { propertyId: sampleProperties[8].id, featureName: 'Hardwood Floors', featureCategory: 'interior' },
      { propertyId: sampleProperties[8].id, featureName: 'Storage Space', featureCategory: 'interior' },
      
      // California Ave Apartment (Property 9)
      { propertyId: sampleProperties[9].id, featureName: 'Community Pool', featureCategory: 'building_amenities' },
      { propertyId: sampleProperties[9].id, featureName: 'Fitness Center', featureCategory: 'building_amenities' },
      { propertyId: sampleProperties[9].id, featureName: 'Updated Kitchen', featureCategory: 'interior' },
      { propertyId: sampleProperties[9].id, featureName: 'Dishwasher', featureCategory: 'appliances' },
      { propertyId: sampleProperties[9].id, featureName: 'In-Unit Laundry', featureCategory: 'appliances' },
      { propertyId: sampleProperties[9].id, featureName: 'Parking Space', featureCategory: 'building_amenities' }
    ]).returning();

    console.log(`✅ Created ${sampleFeatures.length} property features`);

    // Add sample conversations and messages
    const sampleConversations = await db.insert(schema.conversations).values([
      {
        conversationType: 'direct',
        propertyId: sampleProperties[0].id,
      },
      {
        conversationType: 'direct', 
        propertyId: sampleProperties[1].id,
      },
      {
        conversationType: 'group',
        title: 'Property Tour Group',
        description: 'Discussion about the downtown property tour',
        propertyId: sampleProperties[2].id,
      },
      // New conversations with test user
      {
        conversationType: 'direct',
        propertyId: sampleProperties[3].id,
      },
      {
        conversationType: 'direct',
        propertyId: sampleProperties[4].id,
      },
      {
        conversationType: 'group',
        title: 'Bay Area Renters Group',
        description: 'Discussion for potential renters in the Bay Area',
        propertyId: null,
      }
    ]).returning();

    console.log(`✅ Created ${sampleConversations.length} conversations`);

    // Add conversation participants
    const sampleParticipants = await db.insert(schema.conversationParticipants).values([
      // Conversation 1: Renter and Landlord about Property 0
      {
        conversationId: sampleConversations[0].id,
        userId: sampleUsers[1].id, // john_renter
        role: 'member',
      },
      {
        conversationId: sampleConversations[0].id,
        userId: sampleUsers[2].id, // sarah_landlord
        role: 'member',
      },
      // Conversation 2: Another renter and landlord
      {
        conversationId: sampleConversations[1].id,
        userId: sampleUsers[4].id, // emma_renter
        role: 'member',
      },
      {
        conversationId: sampleConversations[1].id,
        userId: sampleUsers[5].id, // david_landlord
        role: 'member',
      },
      // Conversation 3: Group chat
      {
        conversationId: sampleConversations[2].id,
        userId: sampleUsers[1].id, // john_renter
        role: 'member',
      },
      {
        conversationId: sampleConversations[2].id,
        userId: sampleUsers[3].id, // mike_owner
        role: 'admin',
        canAddMembers: true,
      },
      {
        conversationId: sampleConversations[2].id,
        userId: sampleUsers[4].id, // emma_renter
        role: 'member',
      },
      // NEW: Conversation 4: Test user with Sarah (landlord)
      {
        conversationId: sampleConversations[3].id,
        userId: sampleUsers[0].id, // test_user (e7393998-e2e6-4e45-b13e-5c522a474ef8)
        role: 'member',
      },
      {
        conversationId: sampleConversations[3].id,
        userId: sampleUsers[2].id, // sarah_landlord
        role: 'member',
      },
      // NEW: Conversation 5: Test user with David (landlord)
      {
        conversationId: sampleConversations[4].id,
        userId: sampleUsers[0].id, // test_user (e7393998-e2e6-4e45-b13e-5c522a474ef8)
        role: 'member',
      },
      {
        conversationId: sampleConversations[4].id,
        userId: sampleUsers[5].id, // david_landlord
        role: 'member',
      },
      // NEW: Conversation 6: Bay Area Renters Group with test user
      {
        conversationId: sampleConversations[5].id,
        userId: sampleUsers[0].id, // test_user (e7393998-e2e6-4e45-b13e-5c522a474ef8)
        role: 'admin',
        canAddMembers: true,
      },
      {
        conversationId: sampleConversations[5].id,
        userId: sampleUsers[1].id, // john_renter
        role: 'member',
      },
      {
        conversationId: sampleConversations[5].id,
        userId: sampleUsers[4].id, // emma_renter
        role: 'member',
      }
    ]).returning();

    console.log(`✅ Created ${sampleParticipants.length} conversation participants`);

    // Add sample messages
    const sampleMessages = await db.insert(schema.messages).values([
      // Messages in conversation 1
      {
        conversationId: sampleConversations[0].id,
        senderId: sampleUsers[1].id, // john_renter
        content: 'Hi! I\'m interested in viewing the Mission District apartment. When would be a good time?',
        messageType: 'text',
      },
      {
        conversationId: sampleConversations[0].id,
        senderId: sampleUsers[2].id, // sarah_landlord
        content: 'Hello John! I\'d be happy to show you the apartment. Are you available this weekend?',
        messageType: 'text',
      },
      {
        conversationId: sampleConversations[0].id,
        senderId: sampleUsers[1].id, // john_renter
        content: 'Yes, Saturday afternoon works great for me. What time?',
        messageType: 'text',
      },
      
      // Messages in conversation 2
      {
        conversationId: sampleConversations[1].id,
        senderId: sampleUsers[4].id, // emma_renter
        content: 'Hello! I saw your SOMA condo listing and I\'m very interested. Could you tell me more about the building amenities?',
        messageType: 'text',
      },
      {
        conversationId: sampleConversations[1].id,
        senderId: sampleUsers[5].id, // david_landlord
        content: 'Hi Emma! The building has a rooftop deck, fitness center, and concierge service. Would you like to schedule a tour?',
        messageType: 'text',
      },
      
      // Messages in group conversation
      {
        conversationId: sampleConversations[2].id,
        senderId: sampleUsers[3].id, // mike_owner
        content: 'Welcome to the property tour group! We\'ll be touring the Temescal house this Sunday at 2 PM.',
        messageType: 'text',
      },
      {
        conversationId: sampleConversations[2].id,
        senderId: sampleUsers[1].id, // john_renter
        content: 'Great! I\'ll be there. Should I bring anything specific?',
        messageType: 'text',
      },
      {
        conversationId: sampleConversations[2].id,
        senderId: sampleUsers[4].id, // emma_renter
        content: 'Looking forward to it! What\'s the exact address?',
        messageType: 'text',
      },

      // NEW: Messages in conversation 4 - Test user with Sarah
      {
        conversationId: sampleConversations[3].id,
        senderId: sampleUsers[0].id, // test_user (e7393998-e2e6-4e45-b13e-5c522a474ef8)
        content: 'Hi Sarah! I saw your Lake Merritt studio listing and I\'m very interested. The location looks perfect for my commute.',
        messageType: 'text',
      },
      {
        conversationId: sampleConversations[3].id,
        senderId: sampleUsers[2].id, // sarah_landlord
        content: 'Hello! Thank you for your interest. The studio has beautiful lake views and vintage charm. Would you like to schedule a viewing?',
        messageType: 'text',
      },
      {
        conversationId: sampleConversations[3].id,
        senderId: sampleUsers[0].id, // test_user
        content: 'That sounds wonderful! I\'m available this week. What times work best for you?',
        messageType: 'text',
      },
      {
        conversationId: sampleConversations[3].id,
        senderId: sampleUsers[2].id, // sarah_landlord
        content: 'I have openings Tuesday at 3 PM or Thursday at 6 PM. Which works better for you?',
        messageType: 'text',
      },

      // NEW: Messages in conversation 5 - Test user with David
      {
        conversationId: sampleConversations[4].id,
        senderId: sampleUsers[0].id, // test_user (e7393998-e2e6-4e45-b13e-5c522a474ef8)
        content: 'Hi David! I\'m interested in your Palo Alto townhouse. Could you tell me more about the neighborhood and amenities?',
        messageType: 'text',
      },
      {
        conversationId: sampleConversations[4].id,
        senderId: sampleUsers[5].id, // david_landlord
        content: 'Hello! The townhouse is in a quiet residential area with excellent schools nearby. It has a private patio, attached garage, and modern smart home features.',
        messageType: 'text',
      },
      {
        conversationId: sampleConversations[4].id,
        senderId: sampleUsers[0].id, // test_user
        content: 'That sounds exactly what I\'m looking for! Is it pet-friendly? And when might I be able to view it?',
        messageType: 'text',
      },

      // NEW: Messages in group conversation 6 - Bay Area Renters Group
      {
        conversationId: sampleConversations[5].id,
        senderId: sampleUsers[0].id, // test_user (e7393998-e2e6-4e45-b13e-5c522a474ef8)
        content: 'Welcome everyone to the Bay Area Renters Group! This is a space to share tips, experiences, and help each other find great places to live.',
        messageType: 'text',
      },
      {
        conversationId: sampleConversations[5].id,
        senderId: sampleUsers[1].id, // john_renter
        content: 'Thanks for creating this group! I\'ve been searching for months and could use all the help I can get.',
        messageType: 'text',
      },
      {
        conversationId: sampleConversations[5].id,
        senderId: sampleUsers[4].id, // emma_renter
        content: 'This is great! Has anyone had experience with landlords in the Mission District?',
        messageType: 'text',
      },
      {
        conversationId: sampleConversations[5].id,
        senderId: sampleUsers[0].id, // test_user
        content: 'I\'ve been looking at a few places there. Happy to share what I\'ve learned so far!',
        messageType: 'text',
      }
    ]).returning();

    console.log(`✅ Created ${sampleMessages.length} messages`);

    // Add sample group invitations
    const sampleInvitations = await db.insert(schema.groupInvitations).values([
      {
        conversationId: sampleConversations[5].id, // Bay Area Renters Group
        invitedUsername: 'alex_newrenter',
        invitedBy: sampleUsers[0].id, // test_user (e7393998-e2e6-4e45-b13e-5c522a474ef8)
        status: 'pending',
      },
      {
        conversationId: sampleConversations[2].id, // Property Tour Group
        invitedUsername: 'test_user',
        invitedBy: sampleUsers[3].id, // mike_owner
        status: 'accepted',
      }
    ]).returning();

    console.log(`✅ Created ${sampleInvitations.length} group invitations`);

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    // Close the database connections
    await migrationClient.end();
    await seedClient.end();
  }
}

// Run the seed function
main().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});