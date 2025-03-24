// App configuration constants

// API Keys and URLs
export const AIML_API_KEY = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || 'demo_mode'; // Use your OpenRouter API key here for DeepSeek
export const HUGGINGFACE_API_KEY = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY || 'demo_mode';
export const HUGGINGFACE_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';

// Environment variables
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'demo_mode';

// Other configuration
export const MAX_CHAT_HISTORY = 20;
export const APP_NAME = 'College AI Assistant';

// App Theme Colors
export const COLORS = {
  primary: '#6C63FF', // Vibrant purple
  secondary: '#FF6B6B', // Coral accent
  background: '#0A0A0A', // Near black
  card: '#1A1A1A', // Dark gray
  text: '#FFFFFF', // White
  textSecondary: '#9CA3AF', // Light gray
  border: '#2D2D2D', // Dark border
  notification: '#FF6B6B', // Coral
  success: '#4ADE80', // Green
  warning: '#FBBF24', // Yellow
  error: '#EF4444', // Red
  gradient: {
    start: '#6C63FF',
    end: '#FF6B6B',
  },
};

// Event Categories
export const EVENT_CATEGORIES = [
  'Academic',
  'Social',
  'Sports',
  'Cultural',
  'Workshop',
  'Seminar',
  'Other',
];

// Resource Types
export const RESOURCE_TYPES = [
  'Test Paper',
  'Timetable',
  'Notes',
];

// Navigation Routes
export const ROUTES = {
  HOME: '/',
  CHAT: '/chat',
  EVENTS: '/events',
  RESOURCES: '/resources',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
};

// Default Messages
export const DEFAULT_AI_MESSAGES = [
  "Hello! I'm your college assistant. How can I help you today?",
  "I can help with information about campus events, resources, and answer general questions about college life.",
  "If you're looking for specific resources or events, you can also check the dedicated sections in the app.",
];

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  CHAT_HISTORY: 'chat_history',
}; 