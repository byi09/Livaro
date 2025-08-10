# Livaro Messaging System - User Testing Guide

## Overview
This guide provides step-by-step instructions for testing the Livaro messaging system with two users to verify real-time messaging functionality.

## Prerequisites
- ✅ Next.js development server running on localhost:3000
- ✅ Supabase and Pusher properly configured
- ✅ Two different email addresses for testing

## Test Environment Setup

### 1. Application Access
- Open your browser and navigate to: `http://localhost:3000`
- Verify the application loads correctly

### 2. User Registration Process

#### User 1 Setup
1. **Sign Up**
   - Click "Sign up" button
   - Use email: `testuser1@example.com`
   - Create a strong password
   - Complete the registration process

2. **Onboarding**
   - Fill in personal information (name, date of birth, etc.)
   - Select user type (renter or landlord)
   - Complete location preferences
   - Set notification preferences
   - Finish onboarding

3. **Navigate to Messaging**
   - Click the floating messaging icon (bottom-right corner)
   - Or navigate to `/messages` page

#### User 2 Setup
1. **Sign Up**
   - Open a new incognito/private browser window
   - Navigate to `http://localhost:3000`
   - Click "Sign up" button
   - Use email: `testuser2@example.com`
   - Create a different strong password
   - Complete the registration process

2. **Onboarding**
   - Complete the same onboarding process as User 1
   - Use different personal information
   - Finish onboarding

3. **Navigate to Messaging**
   - Click the floating messaging icon
   - Or navigate to `/messages` page

## Testing Scenarios

### Scenario 1: Basic Messaging Functionality

#### Step 1: Create Conversation
1. **User 1 Actions:**
   - Open messaging interface
   - Click "New Conversation" or "+" button
   - Select "Direct Message" type
   - Search for User 2's username or email
   - Select User 2 as participant
   - Create the conversation

2. **User 2 Verification:**
   - Check if the conversation appears in their conversation list
   - Verify they can see the conversation title/participant info

#### Step 2: Send First Message
1. **User 1 Actions:**
   - Select the conversation with User 2
   - Type a test message: "Hello! This is a test message from User 1"
   - Send the message

2. **User 2 Verification:**
   - Check if the message appears instantly in their conversation
   - Verify the message content is correct
   - Check if unread count updates

#### Step 3: Real-time Response
1. **User 2 Actions:**
   - Type a response: "Hi User 1! I received your message in real-time!"
   - Send the response

2. **User 1 Verification:**
   - Check if the response appears instantly
   - Verify the message content is correct

### Scenario 2: Advanced Features Testing

#### Step 1: Message Tags
1. **User 1 Actions:**
   - Send a message with tags: "This is an urgent message"
   - Add tags like "urgent", "follow-up" when sending

2. **User 2 Verification:**
   - Check if tags are displayed correctly
   - Test filtering by tags

#### Step 2: Conversation Management
1. **User 1 Actions:**
   - Test conversation search functionality
   - Try filtering by conversation type
   - Test sorting options (newest, oldest)

2. **User 2 Actions:**
   - Test the same features
   - Verify consistency between users

#### Step 3: UI Features
1. **Both Users:**
   - Test minimize/maximize functionality
   - Verify floating icon works from different pages
   - Test responsive design on mobile/tablet
   - Check unread badge updates

### Scenario 3: Group Chat Testing

#### Step 1: Create Group Chat
1. **User 1 Actions:**
   - Create a new group conversation
   - Add User 2 as participant
   - Set group title: "Test Group Chat"

2. **User 2 Verification:**
   - Check if group chat appears in conversation list
   - Verify group title is displayed

#### Step 2: Group Messaging
1. **Both Users:**
   - Send messages in the group chat
   - Verify all participants receive messages
   - Test group-specific features

## Expected Results

### ✅ Success Criteria

#### Real-time Messaging
- Messages appear instantly for both users
- No manual refresh required
- Messages persist between sessions
- Real-time updates for conversation list

#### User Interface
- Floating messaging icon visible on all pages
- Modal opens and closes smoothly
- Responsive design works on different screen sizes
- Unread badges update correctly

#### Conversation Management
- Conversations can be created successfully
- Participants are added correctly
- Search and filtering work as expected
- Message history is preserved

#### Security
- Users can only access their own conversations
- Authentication required for all messaging features
- No unauthorized access to private channels

### ❌ Common Issues to Watch For

#### Real-time Issues
- Messages not appearing instantly
- Duplicate messages
- Connection drops
- Channel authentication failures

#### UI Issues
- Floating icon not visible
- Modal not opening/closing
- Unread counts not updating
- Responsive design problems

#### Authentication Issues
- Users logged out unexpectedly
- Cannot access messaging features
- Session management problems

## Troubleshooting

### If Real-time Messaging Doesn't Work
1. Check browser console for Pusher errors
2. Verify Pusher environment variables are set
3. Check network connectivity
4. Try refreshing the page

### If Messages Don't Send
1. Check if user is authenticated
2. Verify conversation exists
3. Check browser console for errors
4. Try creating a new conversation

### If UI Doesn't Work
1. Clear browser cache
2. Check for JavaScript errors
3. Try different browser
4. Verify all components are loaded

## Test Completion Checklist

### User 1 Checklist
- [ ] Successfully registered and onboarded
- [ ] Can access messaging interface
- [ ] Created conversation with User 2
- [ ] Sent messages that appear instantly for User 2
- [ ] Received real-time responses from User 2
- [ ] Tested all UI features (minimize, search, etc.)

### User 2 Checklist
- [ ] Successfully registered and onboarded
- [ ] Can access messaging interface
- [ ] Sees conversation created by User 1
- [ ] Received real-time messages from User 1
- [ ] Sent responses that appear instantly for User 1
- [ ] Tested all UI features

### System Verification
- [ ] Real-time messaging works in both directions
- [ ] Messages persist after page refresh
- [ ] Floating icon works from different pages
- [ ] Modal interface functions properly
- [ ] Search and filtering work correctly
- [ ] No console errors during testing

## Reporting Results

After completing the testing, document:

1. **Test Results Summary**
   - Which features worked correctly
   - Any issues encountered
   - Performance observations

2. **Screenshots/Recordings**
   - Capture successful real-time messaging
   - Document any UI issues
   - Record error messages if any

3. **Recommendations**
   - Suggested improvements
   - Additional features needed
   - Performance optimizations

## Conclusion

This testing guide ensures comprehensive verification of the Livaro messaging system's real-time functionality. By following these steps with two users, you can verify that all core messaging features are working correctly and ready for production use.

---

**Test Guide Version**: 1.0  
**Last Updated**: December 2024  
**System Version**: Livaro Messaging v1.0 