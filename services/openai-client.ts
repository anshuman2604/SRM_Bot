import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../constants/Config';

// Define the AI's knowledge base and available resources
const KNOWN_TOPICS = {
  events: ['Academic', 'Social', 'Sports', 'Cultural', 'Workshop', 'Seminar', 'Other'],
  resources: ['Test Paper', 'Timetable', 'Notes'],
  general: ['campus facilities', 'college rules', 'academic calendar']
};

// Define what specific resources are actually available
const AVAILABLE_RESOURCES = {
  notes: [], // Empty array means no notes are currently available
  testPapers: [], // Empty array means no test papers are currently available
  timetables: [], // Empty array means no timetables are currently available
};

/**
 * Checks if the user is asking about resources
 * @param message The user's message
 * @returns boolean indicating if this is a resource request
 */
const isResourceRequest = (message: string): boolean => {
  const resourceTerms = ['notes', 'note', 'study material', 'materials', 'test paper', 'timetable', 'schedule'];
  return resourceTerms.some(term => message.toLowerCase().includes(term));
};

/**
 * Validates if the response contains information within known boundaries
 * @param response The AI's response
 * @param userMessage The original user message
 * @returns cleaned response or error message
 */
const validateResponse = (response: string, userMessage: string): string => {
  // First check if this is a resource request
  if (isResourceRequest(userMessage)) {
    return "I apologize, but I don't currently have access to any specific notes, study materials, test papers, or timetables in my database. Please check with your professors or the college portal for official study materials.";
  }

  // Check for specific claims about courses, professors, or schedules
  if (
    response.match(/\b(course code|professor|instructor|room number|office hours)\b/i) &&
    !response.includes("I don't have specific information about")
  ) {
    return "I apologize, but I don't have access to specific information about courses, professors, or schedules. Please check the official college resources for that information.";
  }

  // Check for specific claims about dates or times
  if (
    response.match(/\b(on|at|every|scheduled for) \d{1,2}[:h]\d{2}\b|\b\d{1,2}(st|nd|rd|th)\b/i) &&
    !response.includes("I don't have the exact")
  ) {
    return "I apologize, but I don't have access to specific scheduling information. Please verify any dates and times with the official college calendar.";
  }

  // Check for promises to provide resources
  if (
    response.match(/\b(I can provide|I can share|I can send|I'll give you|here are the|let me share)\b/i) &&
    isResourceRequest(userMessage)
  ) {
    return "I apologize, but I don't have access to any specific study materials or resources. Please check with your professors or the college portal for official materials.";
  }

  return response;
};

/**
 * Send a message to the AI API and get a response
 * @param message User message
 * @param systemPrompt System prompt for the AI
 * @returns AI response
 */
export const sendMessageToAIMLAPI = async (message: string, systemPrompt: string = 'You are a helpful assistant.'): Promise<string> => {
  try {
    // Use the API key from Config
    const apiKey = GEMINI_API_KEY;
    
    console.log("API Key status:", apiKey === 'demo_mode' ? 'Using demo mode' : 'API key found');
    
    // Check if we're in demo mode
    if (!apiKey || apiKey === 'demo_mode') {
      console.log("No API key found. Please check your .env file has EXPO_PUBLIC_GEMINI_API_KEY set.");
      throw new Error('DEMO_MODE');
    }

    console.log("Using Google Gemini API...");

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the model - using Gemini 2.0 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    try {
      // Create a more restrictive system prompt
      const enhancedSystemPrompt = `${systemPrompt}

Important instructions:
1. You are a college assistant with access to ONLY the following information:
   - Event categories: ${KNOWN_TOPICS.events.join(', ')}
   - Resource types: ${KNOWN_TOPICS.resources.join(', ')}
   - General topics: ${KNOWN_TOPICS.general.join(', ')}

2. CRITICAL: You currently have NO ACCESS to any specific:
   - Notes or study materials
   - Test papers
   - Timetables
   - Course materials
   If asked for any of these, clearly state that you don't have access to them.

3. If asked about anything outside these topics, respond with "I don't have access to that specific information"

4. NEVER make up or guess information about:
   - Specific courses or course codes
   - Professors or staff members
   - Room numbers or locations
   - Specific dates, times, or schedules
   - Study materials or resources

5. Always be honest about your limitations
6. If unsure, direct users to check official college resources
7. NEVER promise to provide or share any materials or resources

User query: ${message}`;
      
      // Generate content using the enhanced prompt
      const result = await model.generateContent(enhancedSystemPrompt);
      const response = await result.response;
      let aiResponse = response.text();
      
      console.log("Gemini API response received successfully");
      
      // Validate the response with the original message
      aiResponse = validateResponse(aiResponse, message);
      
      // Make sure the response doesn't sound too robotic
      const cleanedResponse = aiResponse
        .replace(/I am an AI assistant/gi, "I'm Campus Buddy")
        .replace(/As an AI/gi, "As your campus assistant")
        .replace(/I don't have personal/gi, "I don't have")
        .replace(/I cannot/gi, "I can't");

      return cleanedResponse || "I'm sorry, I couldn't generate a response. Could you try asking me in a different way?";
    } catch (apiError) {
      console.error("Gemini API error details:", apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Provide a more helpful fallback response
    if (error instanceof Error && error.message === 'DEMO_MODE') {
      return "I'm currently running in demo mode because I can't access the Gemini API. Please check your API key setup in the .env file. For help, see the APP_DOCUMENTATION.md file.";
    }
    
    // For other API errors, provide a helpful message
    return `I'm having trouble connecting to my AI service. This might be due to API limits, an invalid key, or network issues. Please try again later or check the API setup. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}; 