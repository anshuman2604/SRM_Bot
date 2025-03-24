# College AI Assistant - Complete Documentation

## Project Overview

The College AI Assistant is a mobile application designed specifically for college students at your institution. It provides an AI-powered assistant that offers information about campus events, resources, and answers questions related to college life. The application includes an admin panel for content management and uses a personalized authentication system.

## Key Features

### 1. AI Chat Assistant
- **College-Specific Information**: Provides details about campus facilities, college rules, and academic calendar
- **Personalized Responses**: Tailors answers based on user's academic profile (degree, major, year)
- **Event Information**: Answers questions about campus events and activities
- **Resource Guidance**: Helps students find relevant educational resources
- **Chat History**: Maintains conversation history for context and reference
- **Hallucination Prevention**: Implements boundary checking to avoid providing incorrect information

### 2. Event Management
- **Browse Events**: View all campus events with filtering options
- **Event Details**: Comprehensive information including date, time, location, category, and description
- **Event Categories**: Organized by type (Academic, Social, Sports, Cultural, Workshop, Seminar, etc.)
- **Search Functionality**: Find events by keyword, date, or category

### 3. Resource Library
- **Educational Materials**: Access to test papers, timetables, and notes
- **Subject Categorization**: Resources organized by subject and type
- **File Metadata**: Information about file type and size
- **Search and Filter**: Find resources by subject, type, or keyword

### 4. Admin Panel
- **Content Management**: Add, edit, and delete events and resources
- **AI-Powered Event Creation**: Generate structured event data from natural language descriptions
- **Protected Access**: Secure admin-only routes with role-based authentication
- **Streamlined Interface**: Focused exclusively on content management

### 5. Authentication System
- **User Accounts**: Email and password-based signup and login
- **User Profiles**: Store academic information and personal interests
- **Admin Roles**: Special privileges for content management
- **Session Management**: Secure token-based authentication

## Technical Implementation

### Database Structure

#### 1. Users Table
- **id** (uuid, primary key): User ID
- **email** (text): User email
- **full_name** (text): User's full name
- **avatar_url** (text): Profile picture URL
- **interests** (array): User's personal interests
- **role** (text): User role ('user' or 'admin')
- **created_at** (timestamp): Account creation time
- **updated_at** (timestamp): Last update time

#### 2. Profiles Table
- **id** (uuid, primary key): Profile ID
- **email** (text): User email
- **full_name** (text): User's full name
- **avatar_url** (text): Profile picture URL
- **interests** (array): User's personal interests
- **major** (text): Field of study
- **year** (text): Year of study
- **degree** (text): Degree program
- **role** (text): User role
- **bio** (text): User biography
- **phone_number** (text): Contact number
- **linkedin_url** (text): LinkedIn profile
- **github_url** (text): GitHub profile
- **resume_url** (text): Resume link
- **notifications_enabled** (boolean): Notification preferences
- **dark_mode** (boolean): UI theme preference

#### 3. Events Table
- **id** (uuid, primary key): Event ID
- **title** (text, required): Event title
- **description** (text, required): Event description
- **date** (text, required): Event date
- **time** (text, optional): Event time
- **location** (text, required): Event location
- **category** (text, required): Event category
- **organizer** (text, optional): Event organizer
- **website_url** (text, optional): Related website

#### 4. Resources Table
- **id** (uuid, primary key): Resource ID
- **title** (text, required): Resource title
- **description** (text, optional): Resource description
- **type** (text, required): Resource type (Test Paper, Timetable, Notes)
- **subject** (text, required): Related subject
- **file_url** (text, required): URL to the resource file
- **file_type** (text, required): Type of file
- **file_size** (text, required): Size of file
- **created_at** (timestamp, required): Creation time

#### 5. Chat History Table
- **id** (uuid, primary key): Message ID
- **user_id** (uuid): User ID
- **message** (text): User message
- **response** (text): AI response
- **created_at** (timestamp): Message timestamp

### AI Implementation

#### Gemini API Integration
- Uses Google's Gemini API through the `@google/generative-ai` package
- Implements response validation to prevent hallucinations
- Personalizes responses based on user profile data

#### Event Data Extraction
- Comprehensive date extraction with support for multiple formats
- Category detection with mapping to predefined categories
- Pattern matching for organizer and location information
- URL detection for website links

### Authentication System

#### User Authentication
- Email and password-based signup and login
- JWT token storage for session management
- User profile data storage and retrieval

#### Admin Authentication
- Role-based access control
- Admin status verification through metadata
- Protected routes for admin-only content

#### SQL Functions for Admin Management
- `check_admin_role`: Verifies if a user has admin privileges
- `check_user_metadata`: Retrieves and validates user metadata
- `set_admin_role`: Grants admin privileges to a user

## Application Structure

### Main Screens
1. **Home Screen**: Main navigation hub with cards for different sections
2. **Chat Screen**: Interface for interacting with the AI assistant
3. **Events Screen**: Browse and search campus events
4. **Resources Screen**: Access educational materials
5. **Admin Login**: Authentication for administrators
6. **Admin Dashboard**: Content management interface for admins

### Key Services
1. **AI Service** (`ai.ts`): Handles AI chat functionality and event data extraction
2. **Auth Service** (`auth.ts`): Manages user authentication and profile data
3. **Storage Service**: Handles local data persistence
4. **Supabase Client**: Manages database operations

## Environment Setup

### Required Environment Variables
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Development Commands
```
# Install dependencies
npm install

# Start development server
npx expo start

# Build for production
npx expo build
```

## Admin Commands

### Grant Admin Privileges
```sql
SELECT set_admin_role('user@example.com');
```

### Revoke Admin Privileges
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"user"')
WHERE email = 'user@example.com';
```

## Future Enhancements
- Enhanced personalization based on user activity
- Integration with college calendar systems
- Push notifications for upcoming events
- Offline mode for resource access
- Analytics dashboard for usage statistics
