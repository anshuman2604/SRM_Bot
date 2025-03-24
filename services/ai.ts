import { DEFAULT_AI_MESSAGES, STORAGE_KEYS } from '../constants/Config';
import { storeData, getData, removeData } from '../services/storage';
import { sendMessageToAIMLAPI } from './openai-client';
import { supabase } from '../lib/supabase';

// Interface for chat message
export interface ChatMessage {
  id?: string;
  user_id?: string;
  message: string;
  response: string;
  created_at?: string;
}

// Interface for event
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  category: string;
  contact_info?: string;
  website_url?: string;
  application_method?: string;
  registration_link?: string;
  organizer?: string;
  additional_details?: string;
}

/**
 * Send a message to the AI API and get a response
 * @param message User message
 * @param userId Optional user ID for storing chat history
 * @param skipStorage Optional flag to skip storing the message (used when the caller already handles storage)
 * @returns AI response
 */
export const sendMessageToAI = async (message: string, userId?: string, skipStorage: boolean = false): Promise<string> => {
  try {
    // Flag to track if we've already stored this message
    let messageStored = false;
    
    // Check for simple acknowledgments and provide direct responses
    const lowerMessage = message.toLowerCase().trim();
    const simpleAcknowledgments: Record<string, string> = {
      'thanks': 'You\'re welcome! Is there anything else I can help you with?',
      'thank you': 'You\'re welcome! Happy to help. Anything else you\'d like to know?',
      'thx': 'You\'re welcome! Need anything else?',
      'ty': 'You\'re welcome! Let me know if you need anything else.',
      'ok': 'Great! Let me know if you need anything else.',
      'okay': 'Sounds good! I\'m here if you need more information.',
      'cool': 'Glad you think so! Anything else you\'d like to know?',
      'great': 'Happy to help! Let me know if you have other questions.',
      'good': 'Great! Is there anything else I can assist you with?',
    };

    // Return simple acknowledgment if applicable
    if (lowerMessage in simpleAcknowledgments) {
      if (userId && !skipStorage) {
        // Store in Supabase directly, no local storage fallback
        await storeChatHistory(userId, message, simpleAcknowledgments[lowerMessage]);
        messageStored = true;
      }
      return simpleAcknowledgments[lowerMessage];
    }

    // Get user profile for personalization
    let userProfile = null;
    if (userId) {
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        userProfile = data;
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
    
    // Get previous conversation history if userId is provided
    let conversationHistory: ChatMessage[] = [];
    if (userId) {
      try {
        conversationHistory = await getChatHistory(userId);
        // Limit to only the last 2 messages to prevent over-reliance on history
        // This helps the AI focus more on the current question
        conversationHistory = conversationHistory.slice(0, 2);
      } catch (error) {
        console.error('Error getting chat history:', error);
      }
    }

    // Check if the message is about events
    const isEventQuery = lowerMessage.includes('event') || 
                         lowerMessage.includes('events') || 
                         lowerMessage.includes('happening') ||
                         lowerMessage.includes('schedule') ||
                         lowerMessage.includes('calendar') ||
                         lowerMessage.includes('upcoming') ||
                         lowerMessage.includes('today') || 
                         lowerMessage.includes('tomorrow') || 
                         lowerMessage.includes('weekend') ||
                         lowerMessage.includes('this week') ||
                         lowerMessage.includes('next week') ||
                         lowerMessage.includes('what') && (lowerMessage.includes('today') || 
                                                           lowerMessage.includes('tomorrow') || 
                                                           lowerMessage.includes('weekend'));
    
    if (isEventQuery) {
      // Try to get real events from Supabase
      const eventsResponse = await getEventsResponse(message);
      if (eventsResponse) {
        // Store chat history if userId is provided
        if (userId && !skipStorage) {
          await storeChatHistory(userId, message, eventsResponse);
          messageStored = true;
        }
        return eventsResponse;
      }
    }
    
    // Try to get information from the database for non-event queries
    const databaseResponse = await getDatabaseResponse(message);
    if (databaseResponse) {
      // Store chat history if userId is provided
      if (userId && !skipStorage) {
        await storeChatHistory(userId, message, databaseResponse);
        messageStored = true;
      }
      return databaseResponse;
    }
    
    // For queries not handled by database or if database query failed, use the AI API
    // Build a system prompt that includes conversation history and strict instructions
    let systemPrompt = generatePersonalizedSystemPrompt(userProfile);
    
    // Create a conversation context for the AI, but keep it minimal
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = '\n\n### REFERENCE ONLY - Previous conversation context (DO NOT REPEAT THIS VERBATIM):\n';
      // Add previous messages in reverse chronological order (oldest first)
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const historyItem = conversationHistory[i];
        conversationContext += `User query: ${historyItem.message}\nYour previous response: ${historyItem.response}\n\n`;
      }
      systemPrompt += conversationContext;
    }
    
    // Add a reminder to be conversational and honest
    systemPrompt += '\n### IMPORTANT: Respond ONLY to the current question. DO NOT repeat or summarize the conversation history. Be natural, conversational, and concise. If you don\'t know something, be honest about it.';
    
    // Call the AI API with the enhanced system prompt
    const response = await sendMessageToAIMLAPI(message, systemPrompt);
    
    // Post-process the response to catch any potential hallucinations
    const processedResponse = preventHallucination(response, message, userProfile);

    // Store chat history if userId is provided and we haven't stored it yet
    if (userId && !messageStored && !skipStorage) {
      await storeChatHistory(userId, message, processedResponse);
    }

    return processedResponse;
  } catch (error: any) {
    console.error('Error sending message to AI:', error);
    
    // If we're in demo mode, try to use real event data instead of mock responses
    if (error.message === 'DEMO_MODE') {
      console.log('Demo mode detected, trying to use real event data');
      
      // Check if the message is about events
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('event') || lowerMessage.includes('events')) {
        try {
          const eventsResponse = await getEventsResponse(lowerMessage);
          if (eventsResponse) {
            // Store chat history if userId is provided
            if (userId && !skipStorage) {
              await storeChatHistory(userId, message, eventsResponse);
            }
            return eventsResponse;
          }
        } catch (innerError) {
          console.error('Error getting events in demo mode:', innerError);
        }
      }
    }
    
    // As a last resort, use a generic response
    const genericResponse = "I'm sorry, I'm having trouble connecting to my knowledge base right now. Could you try asking me again in a different way?";
    
    // Store chat history if userId is provided
    if (userId && !skipStorage) {
      await storeChatHistory(userId, message, genericResponse);
    }
    
    return genericResponse;
  }
};

/**
 * Post-process AI response to prevent hallucinations
 * @param response AI response
 * @param userMessage User message
 * @returns Processed response
 */
const preventHallucination = (response: string, userMessage: string, userProfile?: any): string => {
  const lowerResponse = response.toLowerCase();
  const lowerUserMessage = userMessage.toLowerCase();

  // Check for course codes
  const courseCodeRegex = /[A-Z]{2,4}\s?\d{3,4}/g;
  const responseCourses = response.match(courseCodeRegex) || [];
  const userCourses = userMessage.match(courseCodeRegex) || [];
  
  // If the response mentions course codes not in the user's message
  if (responseCourses.length > 0 && !responseCourses.every(course => userMessage.includes(course))) {
    return "I don't have specific information about course codes or class schedules. For accurate information, I recommend checking your college's official course catalog or student portal.";
  }

  // Check for professor names
  if ((lowerResponse.includes('professor') || lowerResponse.includes('prof.') || lowerResponse.includes('instructor')) && 
      (lowerResponse.includes('office hours') || lowerResponse.includes('email') || lowerResponse.includes('contact'))) {
    
    // If the user didn't ask about a specific professor
    if (!lowerUserMessage.includes('professor') && !lowerUserMessage.includes('prof')) {
      return "I don't have specific information about professors or their office hours, but I can share some general advice about connecting with professors. Would that help?";
    }
  }

  // Add personalized greeting if appropriate
  if (userProfile?.full_name && 
      (lowerUserMessage.includes('hello') || 
       lowerUserMessage.includes('hi') || 
       lowerUserMessage.includes('hey'))) {
    response = response.replace(/^(Hello|Hi|Hey)( there)?!?/i, `$1 ${userProfile.full_name}!`);
  }

  // Add personalized recommendations based on major if asking about resources
  if (userProfile?.major && 
      (lowerUserMessage.includes('resource') || 
       lowerUserMessage.includes('recommend') || 
       lowerUserMessage.includes('suggestion'))) {
    const majorSpecificResponse = `Based on your major in ${userProfile.major}, you might find these particularly helpful: `;
    if (!response.includes(userProfile.major)) {
      response += `\n\n${majorSpecificResponse}`;
    }
  }

  return response;
};

/**
 * Check if the AI response is related to the current question
 * @param response AI response in lowercase
 * @param question User question in lowercase
 * @returns True if related, false otherwise
 */
const isRelatedToCurrentQuestion = (response: string, question: string): boolean => {
  // For most questions, just assume the AI is responding appropriately
  // This makes the AI more conversational and less restricted
  return true;
};

/**
 * Get a response about events from Supabase
 * @param message User message in lowercase
 * @returns Response about events or null if no events found
 */
const getEventsResponse = async (message: string): Promise<string | null> => {
  try {
    // Check if the message is asking about events
    const eventKeywords = ['event', 'events', 'happening', 'schedule', 'calendar', 'upcoming', 'today', 'tomorrow', 'weekend', 'what\'s on', 'this week', 'next week', 'week'];
    const isAskingAboutEvents = eventKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (!isAskingAboutEvents) {
      return null;
    }
    
    // Get events from Supabase without filtering by category initially
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Supabase error:', error);
      return null;
    }
    
    if (!events || events.length === 0) {
      return "I don't see any events in our database yet. You can add events through the admin panel if you have access.";
    }
    
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Format dates for display
    const formatDate = (dateString: string, timeString?: string) => {
      try {
        // If we have both date and time strings, combine them
        let dateTimeString = dateString;
        if (timeString && dateString.indexOf(':') === -1) {
          // If the date doesn't already include time
          dateTimeString = `${dateString} ${timeString}`;
        }
        
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        });
      } catch (error) {
        console.error('Error formatting date:', error, { dateString, timeString });
        return dateString;
      }
    };

    // Check if the user is asking about a specific event
    const eventTitleWords = message.split(/\s+/).filter(word => word.length > 3);
    const specificEventQuery = eventTitleWords.some(word => {
      return sortedEvents.some(event => 
        event.title.toLowerCase().includes(word.toLowerCase()) && 
        !['event', 'events', 'about', 'tell', 'what', 'when', 'where', 'details'].includes(word.toLowerCase())
      );
    });

    // Check if user wants to see all events
    const showAllEvents = message.toLowerCase().includes('all events') || 
                         message.toLowerCase().includes('show all') || 
                         message.toLowerCase().includes('list all') ||
                         message.toLowerCase().includes('see all');

    // Check for category filters
    const categoryKeywords = [
      'academic', 'sports', 'cultural', 'tech', 'workshop', 
      'seminar', 'conference', 'meeting', 'social', 'club'
    ];
    
    let categoryFilter = null;
    for (const category of categoryKeywords) {
      if (message.toLowerCase().includes(category)) {
        categoryFilter = category;
        break;
      }
    }
    
    // Apply category filter if specified
    let filteredEvents = sortedEvents;
    if (categoryFilter) {
      filteredEvents = sortedEvents.filter(event => 
        event.category && event.category.toLowerCase().includes(categoryFilter.toLowerCase())
      );
      
      if (filteredEvents.length === 0) {
        return `I don't see any events in the "${categoryFilter}" category. Would you like to see all events instead?`;
      }
    }

    if (showAllEvents) {
      // Show all upcoming events
      const now = new Date();
      const upcoming = filteredEvents.filter(event => new Date(event.date) >= now);
      
      if (upcoming.length === 0) {
        return "I don't see any upcoming events scheduled at the moment. Check back later or add events through the admin panel if you have access.";
      }
      
      let response = `Here are all upcoming events (${upcoming.length} total):\n\n`;
      
      // Group events by date for better readability
      const eventsByDate: Record<string, any[]> = {};
      upcoming.forEach(event => {
        const eventDate = new Date(event.date);
        const dateKey = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }
        
        eventsByDate[dateKey].push(event);
      });
      
      // Display events grouped by date
      let eventCounter = 1;
      Object.keys(eventsByDate).forEach(dateKey => {
        response += `📆 ${dateKey}\n\n`;
        
        eventsByDate[dateKey].forEach(event => {
          response += `${eventCounter}. ${event.title}\n`;
          response += `   ⏰ ${event.time || 'Time not specified'}\n`;
          response += `   📍 ${event.location}\n`;
          
          // Extract URLs from description
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const urls = event.description.match(urlRegex);
          
          if (urls && urls.length > 0) {
            response += `   🔗 Link: ${urls[0]}\n`;
          }
          
          response += "\n";
          eventCounter++;
        });
      });
      
      response += "Would you like more details about any specific event? Just ask about it by name.";
      return response;
    }

    if (specificEventQuery) {
      // Find events that match words in the query
      const matchingEvents = filteredEvents.filter(event => {
        return eventTitleWords.some(word => 
          event.title.toLowerCase().includes(word.toLowerCase()) && 
          !['event', 'events', 'about', 'tell', 'what', 'when', 'where', 'details'].includes(word.toLowerCase())
        );
      });

      if (matchingEvents.length > 0) {
        // If asking about a specific event, provide detailed info
        const event = matchingEvents[0];
        
        // Extract additional details from description if they exist
        const additionalInfo: Record<string, string> = {};
        
        // Look for patterns like "Organizer: Something" in the description
        const patterns = [
          { key: 'organizer', pattern: /Organizer:\s*([^\n]+)/i },
          { key: 'website_url', pattern: /Website:\s*([^\n]+)/i },
          { key: 'additional_details', pattern: /Additional info:\s*([^\n]+)/i }
        ];
        
        // Extract information using patterns
        patterns.forEach(({ key, pattern }) => {
          const match = event.description.match(pattern);
          if (match && match[1]) {
            additionalInfo[key] = match[1].trim();
          }
        });
        
        // Look for URLs in the description if not already found
        if (!additionalInfo.website_url) {
          // Find all URLs in the description
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const urls = event.description.match(urlRegex);
          
          if (urls && urls.length > 0) {
            additionalInfo.website_url = urls[0];
          }
        }
        
        // Clean up description by removing the additional fields section
        let cleanDescription = event.description;
        const additionalFieldsIndex = event.description.indexOf('\n\nOrganizer:');
        if (additionalFieldsIndex > 0) {
          cleanDescription = event.description.substring(0, additionalFieldsIndex);
        }
        
        // Create response with main event details
        let response = `Sure! Here's what I know about ${event.title}:\n\n`;
        
        // Format the event details in a clear, structured way
        response += `📅 Date: ${formatDate(event.date, event.time)}\n`;
        response += `📍 Location: ${event.location}\n`;
        response += `🏷️ Category: ${event.category}\n`;
        
        // Add links if available
        if (additionalInfo.website_url) {
          response += `🔗 Website: ${additionalInfo.website_url}\n`;
        }
        
        // Add organizer if available
        if (event.organizer) {
          response += `👥 Organizer: ${event.organizer}\n`;
        }
        
        // Add description
        response += `\n📝 Description:\n${cleanDescription}\n`;
        
        // Add additional details if available
        if (additionalInfo.additional_details) {
          response += `\n📌 Additional info: ${additionalInfo.additional_details}\n`;
        }
        
        response += "\nLet me know if you want to know more!";
        return response;
      }
    }

    // Check if the user is asking about a specific time
    if (message.includes('today')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate < tomorrow;
      });
      
      if (todayEvents.length === 0) {
        return "There aren't any events scheduled for today. Would you like to know about upcoming events instead?";
      }
      
      let response = "Here's what's happening today:\n\n";
      todayEvents.forEach((event, index) => {
        response += `${index + 1}. ${event.title}\n`;
        response += `   ⏰ ${event.time || 'Time not specified'}\n`;
        response += `   📍 ${event.location}\n`;
        
        // Extract URLs from description
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = event.description.match(urlRegex);
        
        if (urls && urls.length > 0) {
          response += `   🔗 Link: ${urls[0]}\n`;
        }
        
        response += "\n";
      });
      
      response += `Total: ${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} today.\n\nAny of these catch your interest? Ask me about a specific event for more details.`;
      return response;
    }
    
    if (message.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      
      const tomorrowEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= tomorrow && eventDate < dayAfter;
      });
      
      if (tomorrowEvents.length === 0) {
        return "I don't see any events scheduled for tomorrow. Would you like to know about other upcoming events?";
      }
      
      let response = "Here's what's happening tomorrow:\n\n";
      tomorrowEvents.forEach((event, index) => {
        response += `${index + 1}. ${event.title}\n`;
        response += `   ⏰ ${event.time || 'Time not specified'}\n`;
        response += `   📍 ${event.location}\n`;
        
        // Extract URLs from description
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = event.description.match(urlRegex);
        
        if (urls && urls.length > 0) {
          response += `   🔗 Link: ${urls[0]}\n`;
        }
        
        response += "\n";
      });
      
      response += `Total: ${tomorrowEvents.length} event${tomorrowEvents.length > 1 ? 's' : ''} tomorrow.\n\nDoes any of these interest you? Ask me about a specific event for more details.`;
      return response;
    }
    
    if (message.includes('weekend') || message.includes('saturday') || message.includes('sunday')) {
      const today = new Date();
      const saturday = new Date();
      saturday.setDate(today.getDate() + (6 - today.getDay()));
      saturday.setHours(0, 0, 0, 0);
      
      const monday = new Date(saturday);
      monday.setDate(monday.getDate() + 2);
      
      const weekendEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= saturday && eventDate < monday;
      });
      
      if (weekendEvents.length === 0) {
        return "Looks like there aren't any events scheduled for this weekend. Would you like to know about upcoming events instead?";
      }
      
      let response = "Here's what's happening this weekend:\n\n";
      weekendEvents.forEach((event, index) => {
        response += `${index + 1}. ${event.title}\n`;
        response += `   ⏰ ${event.time || 'Time not specified'}\n`;
        response += `   📍 ${event.location}\n`;
        
        // Extract URLs from description
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = event.description.match(urlRegex);
        
        if (urls && urls.length > 0) {
          response += `   🔗 Link: ${urls[0]}\n`;
        }
        
        response += "\n";
      });
      
      response += `Total: ${weekendEvents.length} event${weekendEvents.length > 1 ? 's' : ''} this weekend.\n\nAny of these sound interesting to you? Ask me about a specific event for more details.`;
      return response;
    }
    
    // Add handling for "this week" queries
    if (message.toLowerCase().includes('this week') || message.toLowerCase().includes('week')) {
      const today = new Date();
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
      
      // Set to the beginning of the current week (Sunday)
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7); // End of week (next Sunday)
      
      const thisWeekEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startOfWeek && eventDate < endOfWeek;
      });
      
      if (thisWeekEvents.length === 0) {
        return "There aren't any events scheduled for this week. Would you like to know about upcoming events instead?";
      }
      
      let response = "Here's what's happening this week:\n\n";
      
      // Group events by day
      const eventsByDay: Record<string, any[]> = {};
      thisWeekEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const dateKey = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        
        if (!eventsByDay[dateKey]) {
          eventsByDay[dateKey] = [];
        }
        
        eventsByDay[dateKey].push(event);
      });
      
      // Display events grouped by day
      Object.keys(eventsByDay).forEach(dateKey => {
        response += `📆 ${dateKey}\n\n`;
        
        eventsByDay[dateKey].forEach((event, index) => {
          response += `${index + 1}. ${event.title}\n`;
          response += `   ⏰ ${event.time || 'Time not specified'}\n`;
          response += `   📍 ${event.location}\n`;
          
          // Extract URLs from description
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const urls = event.description.match(urlRegex);
          
          if (urls && urls.length > 0) {
            response += `   🔗 Link: ${urls[0]}\n`;
          }
          
          response += "\n";
        });
      });
      
      response += `Total: ${thisWeekEvents.length} event${thisWeekEvents.length > 1 ? 's' : ''} this week.\n\nAny of these interest you? Ask me about a specific event for more details.`;
      return response;
    }
    
    // Add handling for "next week" queries
    if (message.toLowerCase().includes('next week')) {
      const today = new Date();
      const startOfNextWeek = new Date(today);
      const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
      
      // Set to the beginning of next week (next Sunday)
      startOfNextWeek.setDate(today.getDate() + (7 - dayOfWeek));
      startOfNextWeek.setHours(0, 0, 0, 0);
      
      const endOfNextWeek = new Date(startOfNextWeek);
      endOfNextWeek.setDate(startOfNextWeek.getDate() + 7); // End of next week
      
      const nextWeekEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startOfNextWeek && eventDate < endOfNextWeek;
      });
      
      if (nextWeekEvents.length === 0) {
        return "There aren't any events scheduled for next week. Would you like to know about other upcoming events instead?";
      }
      
      let response = "Here's what's happening next week:\n\n";
      
      // Group events by day
      const eventsByDay: Record<string, any[]> = {};
      nextWeekEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const dateKey = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        
        if (!eventsByDay[dateKey]) {
          eventsByDay[dateKey] = [];
        }
        
        eventsByDay[dateKey].push(event);
      });
      
      // Display events grouped by day
      Object.keys(eventsByDay).forEach(dateKey => {
        response += `📆 ${dateKey}\n\n`;
        
        eventsByDay[dateKey].forEach((event, index) => {
          response += `${index + 1}. ${event.title}\n`;
          response += `   ⏰ ${event.time || 'Time not specified'}\n`;
          response += `   📍 ${event.location}\n`;
          
          // Extract URLs from description
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const urls = event.description.match(urlRegex);
          
          if (urls && urls.length > 0) {
            response += `   🔗 Link: ${urls[0]}\n`;
          }
          
          response += "\n";
        });
      });
      
      response += `Total: ${nextWeekEvents.length} event${nextWeekEvents.length > 1 ? 's' : ''} next week.\n\nAny of these interest you? Ask me about a specific event for more details.`;
      return response;
    }
    
    // Default to showing upcoming events
    const now = new Date();
    const upcoming = filteredEvents.filter(event => new Date(event.date) >= now);
    
    if (upcoming.length === 0) {
      return "I don't see any upcoming events scheduled at the moment. Check back later or add events through the admin panel if you have access.";
    }
    
    // Show the next 3 events or fewer if there aren't that many
    const eventsToShow = upcoming.slice(0, 3);
    
    let response = `Here are the upcoming events (${upcoming.length} total):\n\n`;
    eventsToShow.forEach((event, index) => {
      response += `${index + 1}. ${event.title}\n`;
      response += `   ⏰ ${event.time || 'Time not specified'}\n`;
      response += `   📍 ${event.location}\n`;
      
      // Extract URLs from description
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = event.description.match(urlRegex);
      
      if (urls && urls.length > 0) {
        response += `   🔗 Link: ${urls[0]}\n`;
      }
      
      response += "\n";
    });
    
    if (upcoming.length > 3) {
      response += `Plus ${upcoming.length - 3} more events. Would you like to see more events or get details about any specific one?`;
    } else {
      response += "Would you like more details about any of these events?";
    }
    
    return response;
  } catch (error) {
    console.error('Error getting events response:', error);
    return null;
  }
};

/**
 * Get chat history for a user
 * @param userId User ID
 * @returns Array of chat messages
 */
export const getChatHistory = async (userId: string): Promise<ChatMessage[]> => {
  try {
    if (!userId) {
      return [];
    }
    
    // Try to get chat history from database
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!error && data && data.length > 0) {
        console.log('Retrieved chat history from database:', data.length, 'messages');
        return data;
      }
    } catch (dbError) {
      console.error('Database error when getting chat history:', dbError);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
};

/**
 * Store chat history in the database
 * @param userId User ID
 * @param message User message
 * @param response AI response
 */
const storeChatHistory = async (userId: string, message: string, response: string): Promise<void> => {
  try {
    // Create a new chat message
    const chatMessage = {
      user_id: userId,
      message,
      response,
      created_at: new Date().toISOString()
    };
    
    // Store in Supabase
    const { error } = await supabase
      .from('chat_history')
      .insert(chatMessage);
    
    if (error) throw error;
    
    console.log('Chat history stored in Supabase');
  } catch (error) {
    console.error('Error storing chat history in Supabase:', error);
    throw error; // Re-throw to handle at the calling site
  }
};

/**
 * Clear chat history for a user
 * @param userId User ID
 */
const clearChatHistory = async (userId: string): Promise<void> => {
  try {
    // Delete from Supabase
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
    
    console.log('Chat history cleared from Supabase');
  } catch (error) {
    console.error('Error clearing chat history from Supabase:', error);
    throw error;
  }
};

/**
 * Get information from the database based on the user's query
 * @param message User message
 * @returns Response with database information or null if not found
 */
const getDatabaseResponse = async (message: string): Promise<string | null> => {
  try {
    const lowerMessage = message.toLowerCase();
    
    // Check if the query is about events (already handled by getEventsResponse)
    const eventKeywords = ['event', 'events', 'happening', 'schedule', 'calendar', 'upcoming', 'today', 'tomorrow', 'weekend', 'this week', 'next week', 'week'];
    if (eventKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return null; // Let getEventsResponse handle this
    }
    
    // Check for user-related queries
    if (lowerMessage.includes('user') || lowerMessage.includes('users') || lowerMessage.includes('student') || lowerMessage.includes('students')) {
      // For security reasons, don't return specific user data, just general stats
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error fetching user count:', error);
        return null;
      }
      
      return `There are currently ${count || 0} registered users in the system. For privacy reasons, I can't provide specific user information.`;
    }
    
    // Check for admin-related queries
    if (lowerMessage.includes('admin') || lowerMessage.includes('administrator')) {
      return "Admin users have special privileges to manage events, users, and other content in the system. If you need admin access, please contact the system administrator.";
    }
    
    // Check for course or academic-related queries
    if (lowerMessage.includes('course') || lowerMessage.includes('class') || lowerMessage.includes('academic') || 
        lowerMessage.includes('subject') || lowerMessage.includes('department')) {
      // Try to fetch from a courses table if it exists
      try {
        const { data: courses, error } = await supabase
          .from('courses')
          .select('*');
        
        if (!error && courses && courses.length > 0) {
          let response = "Here are the courses available:\n\n";
          courses.forEach((course, index) => {
            response += `${index + 1}. ${course.title || course.name}\n`;
            if (course.description) {
              response += `   ${course.description}\n`;
            }
            if (course.instructor) {
              response += `   Instructor: ${course.instructor}\n`;
            }
            response += "\n";
          });
          return response;
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        // Table might not exist, continue to fallback response
      }
      
      return "I don't have specific course information in my database. Please check the official college website or contact the academic office for course details.";
    }
    
    // Check for facility or location-related queries
    if (lowerMessage.includes('facility') || lowerMessage.includes('facilities') || 
        lowerMessage.includes('building') || lowerMessage.includes('location') || 
        lowerMessage.includes('campus') || lowerMessage.includes('library') || 
        lowerMessage.includes('lab') || lowerMessage.includes('laboratory')) {
      // Try to fetch from a facilities table if it exists
      try {
        const { data: facilities, error } = await supabase
          .from('facilities')
          .select('*');
        
        if (!error && facilities && facilities.length > 0) {
          let response = "Here are the facilities available on campus:\n\n";
          facilities.forEach((facility, index) => {
            response += `${index + 1}. ${facility.name}\n`;
            if (facility.location) {
              response += `   Location: ${facility.location}\n`;
            }
            if (facility.description) {
              response += `   ${facility.description}\n`;
            }
            if (facility.hours) {
              response += `   Hours: ${facility.hours}\n`;
            }
            response += "\n";
          });
          return response;
        }
      } catch (error) {
        console.error('Error fetching facilities:', error);
        // Table might not exist, continue to fallback response
      }
      
      return "I don't have specific facility information in my database. Please check the official college website or contact the administration for facility details.";
    }
    
    // Check for club or organization-related queries
    if (lowerMessage.includes('club') || lowerMessage.includes('organization') || 
        lowerMessage.includes('society') || lowerMessage.includes('association') || 
        lowerMessage.includes('committee')) {
      // Try to fetch from a clubs table if it exists
      try {
        const { data: clubs, error } = await supabase
          .from('clubs')
          .select('*');
        
        if (!error && clubs && clubs.length > 0) {
          let response = "Here are the clubs and organizations on campus:\n\n";
          clubs.forEach((club, index) => {
            response += `${index + 1}. ${club.name}\n`;
            if (club.description) {
              response += `   ${club.description}\n`;
            }
            if (club.contact) {
              response += `   Contact: ${club.contact}\n`;
            }
            response += "\n";
          });
          return response;
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
        // Table might not exist, continue to fallback response
      }
      
      return "I don't have specific club or organization information in my database. Please check the official college website or contact the student affairs office for details about clubs and organizations.";
    }
    
    // No matching database information found
    return null;
  } catch (error) {
    console.error('Error getting database response:', error);
    return null;
  }
};

// Add this function to generate a personalized system prompt based on user profile
export const generatePersonalizedSystemPrompt = (userProfile: any) => {
  let personalizedPrompt = `You are a helpful and friendly college AI assistant. Your goal is to provide accurate, concise, and helpful information to college students.`;

  // Add personalization if user profile exists
  if (userProfile) {
    // Add name-based personalization
    if (userProfile.full_name) {
      personalizedPrompt += ` You're speaking with ${userProfile.full_name}.`;
    }

    // Add academic-based personalization
    if (userProfile.degree || userProfile.major || userProfile.year) {
      personalizedPrompt += ` The student is`;
      
      if (userProfile.year) {
        personalizedPrompt += ` in year ${userProfile.year}`;
      }
      
      if (userProfile.degree) {
        personalizedPrompt += ` of their ${userProfile.degree} degree`;
      }
      
      if (userProfile.major) {
        personalizedPrompt += ` in ${userProfile.major}`;
      }
      
      personalizedPrompt += `.`;
    }

    // Add interest-based personalization
    if (userProfile.interests && userProfile.interests.length > 0) {
      personalizedPrompt += ` They are interested in ${userProfile.interests.join(', ')}.`;
    }
  }

  // Add general instructions
  personalizedPrompt += `
  
  Be conversational, friendly, and concise in your responses. Focus on the current question while maintaining context from recent messages.
  
  When asked about courses, professors, or campus facilities, only provide information that is explicitly mentioned in the conversation history or that you're absolutely certain about.
  
  If you don't know something specific about the college, admit that you don't have that information rather than making it up.
  
  Treat each new unrelated question as the start of a new conversation while still remembering the user's profile information.`;

  return personalizedPrompt;
};