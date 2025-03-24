# College AI Assistant

A mobile application that provides college students with an AI assistant to help with campus information, events, and resources.

## Features

- Chat with AI about college-related topics
- Browse and search campus events
- Access college resources
- Admin panel for managing events and content

## Documentation

For comprehensive documentation of the application, please refer to [APP_DOCUMENTATION.md](./APP_DOCUMENTATION.md).

## API Setup

### Using Gemini API

The app is configured to use Google's Gemini AI model. Follow these steps to set it up:

1. Get your Gemini API key from the Google AI Studio
2. Create a `.env` file in the root directory with the following content:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```

### API Configuration

The app uses the following API endpoints:
- Google Gemini AI: For the chat functionality
- Supabase: For database storage of events, resources, and chat history

## Running the App

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npx expo start
   ```

3. Use the Expo Go app on your mobile device to scan the QR code and run the app

## Admin Access

To access the admin panel:
1. Navigate to the Admin section
2. Use the default credentials (or create your own in Supabase):
   - Username: admin
   - Password: password

## Troubleshooting

If you encounter API limit issues:
1. Check your Google AI Studio usage dashboard
2. Consider upgrading to a paid plan for more tokens
3. The app will fall back to demo mode if API calls fail

## Authentication System

The College AI Assistant now includes a personalized authentication system that allows users to:

1. Create an account with their email and password
2. Update their profile with academic information (degree, major, year of study)
3. Add personal interests for tailored recommendations
4. Receive personalized AI responses based on their profile

### Setting Up Authentication

To set up the authentication system:

1. Make sure your Supabase project is configured with the following:
   - Authentication enabled with Email provider
   - Database tables created using the SQL files in the `sql/` directory
   - Row Level Security (RLS) policies properly configured

2. Run the SQL commands in `sql/create_users_table.sql` to create the users table
3. Run the SQL commands in `sql/update_chat_history_table.sql` to update the chat history table

### User Profile Data

The system stores the following user information:
- Full name
- Email
- Degree (Bachelor, Master, PhD, Associate)
- Major/Field of study
- Year of study
- Personal interests
- Avatar (profile picture)

This information is used to personalize the AI assistant's responses and provide tailored recommendations.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
