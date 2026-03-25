import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';

// IMPORTANT: If testing on a physical phone via Expo Go, replace 'localhost' 
// with your computer's local Wi-Fi IP address (e.g., '192.168.1.100').
// For iOS Simulator, '127.0.0.1' works. For Android Emulator, use '10.0.2.2'.
const API_URL = 'http://127.0.0.1:8000/api/chat';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Good morning! It's been a busy night in Tech and Finance. How much time do you have to catch up?",
      sender: 'bot',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async (text: string, timeMinutes: number = 5) => {
    if (!text.trim()) return;

    // Add user message to UI
    const newUserMsg: Message = { id: Date.now().toString(), text, sender: 'user' };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Send to FastAPI backend
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_message: text, time_available_minutes: timeMinutes }),
      });

      const data = await response.json();

      // Add bot response to UI
      const newBotMsg: Message = { id: (Date.now() + 1).toString(), text: data.reply, sender: 'bot' };
      setMessages((prev) => [...prev, newBotMsg]);
    } catch (error) {
      console.error("Failed to fetch from backend:", error);
      const errorMsg: Message = { id: (Date.now() + 1).toString(), text: "Whoops, couldn't connect to the server.", sender: 'bot' };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Chat Feed */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Frost UI Bottom Area */}
        <BlurView intensity={80} tint="dark" style={styles.bottomContainer}>
          
          {/* Quick Action Chips */}
          <View style={styles.chipsContainer}>
            <TouchableOpacity style={styles.chip} onPress={() => sendMessage("Give me the 2-minute quick hits.", 2)}>
              <Text style={styles.chipText}>☕ 2 Min</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => sendMessage("I have a 10-minute commute.", 10)}>
              <Text style={styles.chipText}>🚗 10 Min</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => sendMessage("Give me a 20-minute deep dive.", 20)}>
              <Text style={styles.chipText}>🛋️ 20 Min</Text>
            </TouchableOpacity>
          </View>

          {/* Natural Language Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Or tell me what you want to know..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => sendMessage(inputText)}
            />
            <TouchableOpacity 
              style={styles.sendButton} 
              onPress={() => sendMessage(inputText)}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sendButtonText}>Send</Text>}
            </TouchableOpacity>
          </View>
        </BlurView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Sleek dark slate background
  },
  keyboardAvoid: {
    flex: 1,
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 160, // Leave room for the frosted bottom area
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  messageText: {
    color: '#F8FAFC',
    fontSize: 16,
    lineHeight: 24,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  chipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipText: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: '#FFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});