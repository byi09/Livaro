# Sublisting Session Management System

This document explains how to use the sublisting session management system that leverages Supabase Auth sessions for storing sublisting data and images.

## Overview

The sublisting session management system provides:
- **Session-based data persistence** tied to Supabase Auth sessions
- **Media file storage and AI processing** for property data extraction  
- **Multi-step form data management** with auto-save capabilities
- **Progress tracking** across the sublisting creation workflow
- **Secure data isolation** using Row Level Security (RLS)

## Architecture

### Database Tables

1. **`sublisting_sessions`** - Main session tracking table
2. **`sublisting_session_media`** - Media files uploaded during sessions
3. **`sublisting_session_data`** - Form data for each step (draft storage)
4. **`sublisting_extracted_data`** - Aggregated AI-extracted data

### Key Features

- **Auth Session Integration**: Uses `session_id` from Supabase Auth JWT claims
- **Automatic Expiration**: Draft sessions expire after configurable hours
- **Progress Tracking**: Tracks completion of each form step
- **AI Data Extraction**: Processes uploaded media to extract property data
- **RLS Security**: Users can only access their own sessions

## Setup

### 1. Run the Migration

```bash
# Run the sublisting session management migration
node run-sublisting-migration.js
```

This creates all necessary tables, RLS policies, indexes, and functions.

### 2. Environment Variables

Ensure you have the following in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Usage

### Basic Hook Usage

```typescript
import { useSublistingSession } from '@/src/hooks/useSublistingSession'

function MyComponent() {
  const {
    session,
    loading,
    error,
    updateSession,
    saveStepData,
    loadStepData,
    isActive,
    progressPercentage
  } = useSublistingSession({
    autoCreate: true,    // Auto-create session if none exists
    expiresHours: 24     // Session expires in 24 hours
  })

  // Session is automatically created and managed
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      <p>Session Status: {session?.sessionStatus}</p>
      <p>Progress: {progressPercentage}%</p>
    </div>
  )
}
```

### Media Management

```typescript
import { useSublistingMedia } from '@/src/hooks/useSublistingMedia'

function MediaUploadComponent() {
  const {
    uploadedFiles,
    addAndProcessFiles,
    removeFile,
    isProcessing,
    totalFilesCount,
    processedFilesCount,
    getAllExtractedData
  } = useSublistingMedia({
    autoProcess: true,
    onDataExtracted: (data, fileId) => {
      console.log('Extracted data:', data)
    }
  })

  const handleFileUpload = async (files: FileList) => {
    await addAndProcessFiles(Array.from(files))
  }

  return (
    <div>
      <input 
        type="file" 
        multiple 
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />
      <p>{processedFilesCount} of {totalFilesCount} files processed</p>
    </div>
  )
}
```

### Form Data Management

```typescript
// Save form data for a specific step
await saveStepData('property_info', {
  address: '123 Main St',
  bedrooms: 2,
  bathrooms: 1,
  rent: 1500
}, false) // isAutoFilled = false

// Load form data for a step
const propertyData = await loadStepData('property_info')

// Update session progress
await updateSession({ 
  propertyInfoCompleted: true,
  sessionStatus: 'in_progress'
})
```

## Integration with Sublisting Pages

### 1. Start Page (`/sell/start`)
- Initialize session when user chooses "Autofill with Leasing Information"
- Store sublease file name in session storage

### 2. Media Management Page (`/sell/manage-media`)
- Use `useSublistingMedia` hook to manage file uploads
- Process files with AI extraction
- Store extracted data in session

### 3. Property Info Page (`/sell/create`)
- Load extracted data from session
- Auto-fill form fields with extracted data
- Save form data to session on changes

### 4. Subsequent Steps
- Each step loads and saves its form data to the session
- Progress is tracked automatically
- Data persists across page refreshes and browser sessions

## Session Lifecycle

1. **Creation**: Session created when user starts sublisting process
2. **Draft**: Session remains in draft status while user fills forms
3. **In Progress**: Status changes when user begins active form completion
4. **Completed**: Session completed when final property is created
5. **Expiration**: Draft sessions expire after configured hours
6. **Cleanup**: Expired sessions are cleaned up automatically

## Security

- **Row Level Security (RLS)**: Users can only access their own sessions
- **Auth Integration**: Sessions tied to Supabase Auth user sessions
- **Secure Storage**: Media files stored in Supabase Storage with proper access controls
- **Data Validation**: API endpoints validate user ownership before operations

## API Endpoints

### Update Media Extraction Status
```typescript
POST /api/sublisting/update-media-extraction
{
  "mediaId": "uuid",
  "extractedData": { /* extracted property data */ },
  "status": "completed"
}
```

### Remove Media File
```typescript
DELETE /api/sublisting/remove-media
{
  "mediaId": "uuid"
}
```

## Database Functions

### Get or Create Session
```sql
SELECT get_or_create_sublisting_session(
  'auth-session-id'::uuid,
  'user-id'::uuid,
  24  -- expires in 24 hours
);
```

### Cleanup Expired Sessions
```sql
SELECT cleanup_expired_sublisting_sessions();
-- Returns number of cleaned up sessions
```

## Best Practices

1. **Always check session status** before performing operations
2. **Handle session expiration** gracefully in your UI
3. **Save form data frequently** to prevent data loss
4. **Use progress tracking** to show users their completion status
5. **Clean up expired sessions** regularly (set up a cron job)

## Example Implementation

See `src/components/SublistingSessionExample.tsx` for a complete working example of how to integrate all features.

## Monitoring

Monitor session usage with these queries:

```sql
-- Active sessions by status
SELECT session_status, COUNT(*) 
FROM sublisting_sessions 
GROUP BY session_status;

-- Average session completion time
SELECT AVG(completed_at - created_at) as avg_completion_time
FROM sublisting_sessions 
WHERE session_status = 'completed';

-- Media processing statistics
SELECT 
  extraction_status, 
  COUNT(*) as count,
  AVG(file_size) as avg_file_size
FROM sublisting_session_media 
GROUP BY extraction_status;
```

This system provides a robust, scalable solution for managing sublisting sessions with proper data persistence, security, and user experience.
