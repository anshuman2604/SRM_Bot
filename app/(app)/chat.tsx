import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  Platform, 
  ScrollView, 
  Keyboard, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Animated,
  Dimensions
} from 'react-native';
import { Text, IconButton, ActivityIndicator, Avatar, Surface } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/Config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendMessageToAI } from '../../services/ai';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import TypingAnimation from '../../components/TypingAnimation';

interface ChatMessage {
  id?: string;
  user_id: string;
  message: string;
  response: string;
  created_at: string;
  isTyping?: boolean;
}

const { width, height } = Dimensions.get('window');

export default function ChatScreen() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [typingText, setTypingText] = useState('');
  const [currentTypingIndex, setCurrentTypingIndex] = useState(-1);
  const typingSpeed = 5; // Much faster typing speed (milliseconds per character)
  const typingChunkSize = 3; // Type multiple characters at once for faster effect

  // Animation values for floating icons
  const floatingIcons = [
    { icon: 'robot', color: '#4A8FE7', size: 24, startY: height },
    { icon: 'microchip', color: '#E94E77', size: 20, startY: height + 100 },
    { icon: 'brain', color: '#9B5DE5', size: 26, startY: height + 200 },
    { icon: 'network-wired', color: '#F15BB5', size: 22, startY: height + 300 },
  ].map(icon => ({
    ...icon,
    translateY: useRef(new Animated.Value(icon.startY)).current,
    opacity: useRef(new Animated.Value(0)).current,
  }));

  // Start floating animation
  useEffect(() => {
    const animateIcons = () => {
      floatingIcons.forEach((icon, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(icon.translateY, {
                toValue: -100,
                duration: 15000 + index * 1000,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(icon.opacity, {
                  toValue: 0.3,
                  duration: 1000,
                  useNativeDriver: true,
                }),
                Animated.timing(icon.opacity, {
                  toValue: 0,
                  duration: 14000,
                  useNativeDriver: true,
                }),
              ]),
            ]),
            Animated.timing(icon.translateY, {
              toValue: icon.startY,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    };

    animateIcons();
  }, []);

  useEffect(() => {
    loadChatHistory();
  }, [user]);

  // Scroll to bottom whenever chat history changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [chatHistory]);

  // Scroll to bottom when keyboard shows/hides
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: false });
    }
  };

  // Typing animation effect
  useEffect(() => {
    if (currentTypingIndex >= 0 && currentTypingIndex < chatHistory.length) {
      const currentMessage = chatHistory[currentTypingIndex];
      if (currentMessage.isTyping && typingText.length < currentMessage.response.length) {
        const timeout = setTimeout(() => {
          // Type multiple characters at once for a faster effect
          const nextChunkSize = Math.min(
            typingChunkSize,
            currentMessage.response.length - typingText.length
          );
          const nextChunk = currentMessage.response.substring(
            typingText.length,
            typingText.length + nextChunkSize
          );
          setTypingText(prev => prev + nextChunk);
        }, typingSpeed);
        return () => clearTimeout(timeout);
      } else if (currentMessage.isTyping && typingText.length >= currentMessage.response.length) {
        // Typing is complete, update the chat history
        const updatedChatHistory = [...chatHistory];
        updatedChatHistory[currentTypingIndex] = {
          ...currentMessage,
          isTyping: false,
        };
        setChatHistory(updatedChatHistory);
        setTypingText('');
        setCurrentTypingIndex(-1);
      }
    }
  }, [chatHistory, currentTypingIndex, typingText]);

  const loadChatHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      setChatHistory(data || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading || !user) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // Add user message to chat history with isTyping for UI only
    const newMessage: ChatMessage = {
      user_id: user.id,
      message: userMessage,
      response: '',
      created_at: new Date().toISOString(),
      isTyping: true,
    };

    // Update local chat history
    const updatedChatHistory = [...chatHistory, newMessage];
    setChatHistory(updatedChatHistory);
    
    try {
      // Send message to AI
      const aiResponse = await sendMessageToAI(userMessage);

      // Set the typing animation for the AI response
      const updatedHistory = [...updatedChatHistory];
      updatedHistory[updatedHistory.length - 1] = {
        ...updatedHistory[updatedHistory.length - 1],
        response: aiResponse,
      };
      
      setChatHistory(updatedHistory);
      setTypingText('');
      setCurrentTypingIndex(updatedHistory.length - 1);

      // Create database object without isTyping field
      const dbMessage = {
        user_id: user.id,
        message: userMessage,
        response: aiResponse,
        created_at: new Date().toISOString(),
      };

      // Save to database without isTyping field
      const { data, error } = await supabase
        .from('chat_history')
        .insert([dbMessage])
        .select();

      if (error) {
        console.error('Error saving chat:', error);
      } else if (data && data.length > 0) {
        // After database save, we'll keep the UI state but update with DB data
        // We'll do this after the typing animation is complete
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error in UI
    } finally {
      setIsLoading(false);
    }
  };

  const clearChatHistory = async () => {
    if (!user) return;

    try {
      // Delete from database
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing chat history:', error);
        return;
      }

      // Clear local state
      setChatHistory([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Floating background icons */}
      {floatingIcons.map((icon, index) => (
        <Animated.View
          key={index}
          style={[
            styles.floatingIcon,
            {
              left: 20 + (index * 80),
              transform: [{ translateY: icon.translateY }],
              opacity: icon.opacity,
            },
          ]}
        >
          <FontAwesome5 name={icon.icon} size={icon.size} color={icon.color} />
        </Animated.View>
      ))}

      {/* Header */}
      <LinearGradient
        colors={['#1A237E', '#304FFE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Surface style={styles.avatarContainer}>
            <Avatar.Icon 
              size={32} 
              icon="robot" 
              color="#FFFFFF" 
              style={{ backgroundColor: 'transparent' }} 
            />
          </Surface>
          <Text style={styles.headerTitle}>AI Assistant</Text>
        </View>
        <IconButton
          icon="trash-can-outline"
          iconColor="#FFFFFF"
          size={24}
          onPress={clearChatHistory}
          style={styles.clearButton}
        />
      </LinearGradient>

      {/* Main content with KeyboardAvoidingView */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        >
          {chatHistory.map((item, index) => (
            <View key={item.id || index} style={styles.chatBubbleContainer}>
              {/* User Message */}
              {item.message && (
                <View style={styles.userMessageRow}>
                  <View style={[styles.chatBubble, styles.userBubble]}>
                    <Text style={[styles.chatText, styles.userText]}>
                      {item.message}
                    </Text>
                  </View>
                  <Surface style={[styles.avatarSurface, { marginLeft: 10 }]}>
                    <Avatar.Icon
                      size={36}
                      icon="account"
                      color="#FFFFFF"
                      style={[styles.userAvatar, { backgroundColor: '#304FFE' }]}
                    />
                  </Surface>
                </View>
              )}

              {/* AI Response */}
              {(item.response || item.isTyping) && (
                <View style={styles.aiMessageRow}>
                  <Surface style={[styles.avatarSurface, { marginRight: 10 }]}>
                    <Avatar.Icon
                      size={36}
                      icon="robot"
                      color="#FFFFFF"
                      style={[styles.aiAvatar, { backgroundColor: '#424242' }]}
                    />
                  </Surface>
                  {item.isTyping ? (
                    <View style={[styles.chatBubble, styles.aiBubble, styles.loadingBubble]}>
                      {currentTypingIndex === index && typingText.length > 0 ? (
                        <Text style={[styles.chatText, styles.aiText]}>
                          {typingText}
                        </Text>
                      ) : (
                        <TypingAnimation />
                      )}
                    </View>
                  ) : (
                    <View style={[styles.chatBubble, styles.aiBubble]}>
                      <Text style={[styles.chatText, styles.aiText]}>
                        {item.response}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
          {/* Extra space at the bottom to ensure content is above the input */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Input area */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
              blurOnSubmit={false}
              autoCorrect={false}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={styles.sendButtonContainer}
              disabled={isLoading || !message.trim()}
              onPress={handleSend}
            >
              <LinearGradient
                colors={['#304FFE', '#7048E8']}
                style={styles.sendGradient}
              >
                <IconButton
                  icon="send"
                  size={24}
                  iconColor="#FFFFFF"
                  style={styles.sendButton}
                  disabled={isLoading || !message.trim()}
                  onPress={handleSend}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A1128',
  },
  keyboardAvoidView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  floatingIcon: {
    position: 'absolute',
    zIndex: -1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    overflow: 'hidden',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clearButton: {
    marginLeft: 10,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 100, // Extra padding at bottom
    flexGrow: 1,
  },
  bottomSpacer: {
    height: 60, // Extra space at the bottom
  },
  chatBubbleContainer: {
    marginVertical: 12,
    width: '100%',
  },
  userMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginLeft: 50,
    marginBottom: 8,
  },
  aiMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginRight: 50,
    marginBottom: 8,
  },
  avatarSurface: {
    borderRadius: 18,
    width: 36,
    height: 36,
    elevation: 2,
    overflow: 'hidden',
  },
  userAvatar: {
    margin: 0,
  },
  aiAvatar: {
    margin: 0,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '80%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  userBubble: {
    backgroundColor: '#304FFE',
    borderTopRightRadius: 4,
    marginLeft: 8,
    marginRight: 0,
  },
  aiBubble: {
    backgroundColor: 'rgba(40, 44, 52, 0.9)',
    borderTopLeftRadius: 4,
    marginRight: 8,
    marginLeft: 0,
  },
  chatText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#FFFFFF',
  },
  loadingBubble: {
    padding: 15,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    backgroundColor: 'rgba(10, 17, 40, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    paddingTop: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textAlignVertical: 'center',
  },
  sendButtonContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  sendGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  sendButton: {
    margin: 0,
  },
});