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
import Building3D from '../../components/Building3D';

interface ChatMessage {
  id?: string;
  user_id: string;
  message: string;
  response: string;
  created_at: string;
}

const { width, height } = Dimensions.get('window');

export default function ChatScreen() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

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

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const loadChatHistory = async () => {
    try {
      // Check if user exists and has an ID
      if (!user?.id) {
        console.log('No user ID found, skipping chat history load');
        return;
      }

      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setChatHistory(data || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    if (!user?.id) {
      console.error('No user ID found');
      return;
    }

    const trimmedMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessageToAI(trimmedMessage);
      
      const newMessage: ChatMessage = {
        user_id: user.id,
        message: trimmedMessage,
        response: response,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('chat_history')
        .insert([newMessage])
        .select()
        .single();

      if (error) throw error;

      setChatHistory(prev => [...prev, data]);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChatHistory = async () => {
    try {
      if (!user?.id) {
        console.error('No user ID found');
        return;
      }

      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setChatHistory([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Animated Background */}
      <LinearGradient
        colors={['#0A1128', '#1C2541']}
        style={StyleSheet.absoluteFill}
      />

      {/* 3D Building Model */}
      <View style={styles.buildingContainer}>
        <Building3D />
      </View>
      
      {/* Floating Icons */}
      {floatingIcons.map((icon, index) => (
        <Animated.View
          key={`float-${index}`}
          style={[
            styles.floatingIcon,
            {
              transform: [{ translateY: icon.translateY }],
              opacity: icon.opacity,
              left: (width / (floatingIcons.length + 1)) * (index + 1),
            },
          ]}
        >
          <FontAwesome5 name={icon.icon} size={icon.size} color={icon.color} />
        </Animated.View>
      ))}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Modern Header */}
        <LinearGradient
          colors={['#304FFE', '#7048E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <Surface style={[styles.avatarSurface, { backgroundColor: '#7048E8' }]}>
                <Avatar.Text 
                  size={36} 
                  label="SR"
                  color="#FFFFFF"
                />
              </Surface>
            </View>
            <Text style={styles.headerTitle}>SRM AI Assistant</Text>
          </View>
          <TouchableOpacity onPress={clearChatHistory}>
            <IconButton 
              icon="delete-outline" 
              size={24} 
              iconColor="#FFFFFF"
              style={styles.clearButton}
            />
          </TouchableOpacity>
        </LinearGradient>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {chatHistory.map((chat, index) => (
            <React.Fragment key={chat.id || index}>
              {/* User Message */}
              <Animated.View
                style={styles.chatBubbleContainer}
              >
                <View style={styles.userMessageRow}>
                  <View style={styles.avatarContainer}>
                    <Surface style={[styles.avatarSurface, { backgroundColor: COLORS.primary }]}>
                      <Avatar.Icon 
                        size={36} 
                        icon="account" 
                        style={styles.userAvatar}
                        color="#FFFFFF"
                      />
                    </Surface>
                  </View>
                  <View style={[styles.chatBubble, styles.userBubble]}>
                    <Text style={[styles.chatText, styles.userText]}>{chat.message}</Text>
                  </View>
                </View>
              </Animated.View>

              {/* AI Response */}
              <Animated.View
                style={styles.chatBubbleContainer}
              >
                <View style={styles.aiMessageRow}>
                  <View style={styles.avatarContainer}>
                    <Surface style={[styles.avatarSurface, { backgroundColor: '#7048E8' }]}>
                      <Avatar.Icon 
                        size={36} 
                        icon="robot" 
                        style={styles.aiAvatar}
                        color="#FFFFFF"
                      />
                    </Surface>
                  </View>
                  <View style={[styles.chatBubble, styles.aiBubble]}>
                    <Text style={[styles.chatText, styles.aiText]}>{chat.response}</Text>
                  </View>
                </View>
              </Animated.View>
            </React.Fragment>
          ))}
          {isLoading && (
            <Animated.View
              style={styles.chatBubbleContainer}
            >
              <View style={styles.aiMessageRow}>
                <View style={styles.avatarContainer}>
                  <Surface style={[styles.avatarSurface, { backgroundColor: '#7048E8' }]}>
                    <Avatar.Icon 
                      size={36} 
                      icon="robot" 
                      style={styles.aiAvatar}
                      color="#FFFFFF"
                    />
                  </Surface>
                </View>
                <View style={[styles.chatBubble, styles.aiBubble, styles.loadingBubble]}>
                  <ActivityIndicator animating={true} color="#7048E8" />
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Input */}
        <LinearGradient
          colors={['rgba(28, 37, 65, 0.8)', 'rgba(10, 17, 40, 0.9)']}
          style={styles.inputWrapper}
        >
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
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
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A1128',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  floatingIcon: {
    position: 'absolute',
    zIndex: -1,
  },
  buildingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
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
    paddingBottom: 30,
    flexGrow: 1,
  },
  chatBubbleContainer: {
    marginVertical: 8,
    width: '100%',
  },
  userMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginLeft: 50,
    marginBottom: 4,
  },
  aiMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginRight: 50,
    marginBottom: 4,
  },
  avatarSurface: {
    borderRadius: 18,
    width: 36,
    height: 36,
    elevation: 2,
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
    maxWidth: '85%',
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
  },
  aiBubble: {
    backgroundColor: 'rgba(40, 44, 52, 0.9)',
    borderTopLeftRadius: 4,
    marginRight: 8,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    marginRight: 10,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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