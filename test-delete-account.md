# Delete Account Function Test Plan

## What the Updated Function Now Does

The enhanced `deleteAccount` function now performs a comprehensive deletion of all user-related data:

### 1. Landlord-Related Data Deletion
- **Properties**: All properties owned by the user (as landlord)
- **Property Listings**: All rental listings for those properties
- **Property Images & Features**: Automatically cascade deleted via foreign key constraints
- **Apartment Buildings**: All apartment buildings owned by the landlord
- **Building Amenities & Images**: Automatically cascade deleted
- **One-Tap Application Preferences**: Automatically cascade deleted when landlord is deleted

### 2. Renter-Related Data Deletion
- **Renter Profile**: The user's renter profile
- **Saved Properties**: Properties saved by the renter (cascade deleted)
- **Property Views**: Property viewing history (cascade deleted)
- **Renter Searches**: Search history (cascade deleted)
- **Renter Search Preferences**: Saved search preferences (cascade deleted)

### 3. User-Specific Data Deletion
- **Notifications**: All notifications sent to or by the user
- **User Preferences**: Notification and other user preferences
- **Liked Properties**: Properties liked by the user

### 4. Messaging Data Deletion
- **Messages**: All messages sent by the user
- **Conversation Participants**: Removes user from all conversations
- **Group Invitations**: All group invitations sent by the user

### 5. Core Account Deletion
- **Customer Record**: The user's customer profile
- **User Record**: The core user record in the database
- **Supabase Auth**: The user's authentication record

## Key Improvements

1. **Complete Property Cleanup**: Now deletes all properties and listings owned by the user
2. **Proper Deletion Order**: Deletes in the correct order to respect foreign key constraints
3. **Cascade Handling**: Leverages database cascade deletes where configured
4. **Error Handling**: Better logging and error reporting
5. **Comprehensive Coverage**: Covers all user-related tables in the database

## Testing Scenarios

To test this function:

1. **Create a landlord user** with properties and listings
2. **Create conversations** and send messages
3. **Like and save properties** as a renter
4. **Set up notifications** and preferences
5. **Call deleteAccount()** and verify all data is removed

## Database Impact

Before deletion, a landlord user might have:
- Multiple properties in the `properties` table
- Multiple listings in the `property_listings` table
- Property images and features
- Conversation participation
- Notifications and preferences

After deletion:
- All of the above should be completely removed
- No orphaned records should remain
- Related users should still be able to access their conversations (though the deleted user's messages remain for context)

This fixes the original issue where deleting a user account left their properties and listings in the database.
