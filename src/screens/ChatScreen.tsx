import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { X, Mic, Send, Smile, Heart, Bot } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../theme';
import BottomNav from '../components/BottomNav';
import { clientApi } from '../api/client';

interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  text: string;
  suggestions: any[];
}

export default function ChatScreen({ navigation }: any) {
  const [message, setMessage] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { id: '1', type: 'bot', text: 'Chào bạn! Tớ là Boba Bot, trợ lý ảo của Boba Babe. Hôm nay bạn muốn uống gì nào?', suggestions: [] },
  ]);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const DEVICE_ID = 'device-customer-01'; 

  const fetchMenu = async () => {
    try {
      const data = await clientApi.getMenu('store-genz-01', 'table-1778318002352');
      if (data.categories) {
        const allItems = data.categories.flatMap((c: any) => c.items);
        setMenuItems(allItems);
        console.log(`[Chat] Menu loaded: ${allItems.length} items`);
      }
    } catch (e) {
      console.error("[Chat] Fetch menu failed:", e);
    }
  };

  React.useEffect(() => {
    fetchMenu();
    
    const showSubscription = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSend = async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || message;
    if (!messageToSend.trim()) return;

    // If menu is empty, try fetching again
    if (menuItems.length === 0) {
      fetchMenu();
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), type: 'user', text: messageToSend, suggestions: [] };
    setChatHistory(prev => [...prev, userMsg]);
    const currentMessage = messageToSend;
    if (!overrideMessage) setMessage('');
    setIsLoading(true);

    try {
      const data = await clientApi.chat(DEVICE_ID, currentMessage);
      let replyText = (data.reply || data).toString();
      
      // Safety: Remove all markdown bolding/header characters
      replyText = replyText.replace(/[*#]/g, '');
      
      // Parse suggestions [SUGGEST: id1, id2] - Improved Regex to hide it
      let cleanText = replyText;
      let suggestedIds: string[] = [];
      const suggestRegex = /\[SUGGEST:\s*([^\]]+)\]/g;
      const matches = [...replyText.matchAll(suggestRegex)];
      
      if (matches.length > 0) {
        // Remove ALL suggest tags from visible text
        cleanText = replyText.replace(suggestRegex, '').trim();
        // Collect all IDs from all tags
        matches.forEach(match => {
          const ids = match[1].split(',').map((s: string) => s.trim());
          suggestedIds.push(...ids);
        });
      }

      // Map IDs to actual menu items with safety checks
      const suggestions = (menuItems && menuItems.length > 0) 
        ? [...new Set(suggestedIds)] // Unique IDs
            .map(id => menuItems.find(item => item && (item._id === id || item.id === id)))
            .filter(Boolean)
        : [];

      const botMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        type: 'bot', 
        text: cleanText,
        suggestions: suggestions as any[]
      };
      setChatHistory(prev => [...prev, botMsg]);
    } catch (e: any) {
      console.error("[Chat] Error:", e.message || e);
      const errMsg: ChatMessage = { 
        id: 'err-' + Date.now(), 
        type: 'bot', 
        text: 'Hic, tớ đang bị mất kết nối một chút. Bạn thử lại sau nhé! 🧋✨', 
        suggestions: [] 
      };
      setChatHistory(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Auto-scroll to bottom when chat history changes or keyboard opens
  React.useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chatHistory, isKeyboardVisible]);

  return (
    <LinearGradient 
      colors={[Colors.lavn, Colors.peach, Colors.mint]} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <X size={24} color={Colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View style={styles.botTitleRow}>
              <Text style={styles.botName}>Boba Bot</Text>
              <Heart size={14} color={Colors.hot} fill={Colors.hot} />
            </View>
            <Text style={styles.botStatus}>đang online • trả lời nhanh</Text>
          </View>
          <View style={{ width: 46 }} />
        </View>

        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatArea} 
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <View style={styles.botAvatar}>
                  <Bot size={40} color={Colors.hot} />
                </View>
                <View style={styles.statusBadge}>
                  <Heart size={12} color="#fff" fill="#fff" />
                </View>
              </View>
              <Text style={styles.greeting}>Chào bạn!</Text>
              <Text style={styles.subGreeting}>Hôm nay bạn muốn uống gì nào?</Text>
            </View>

            <View style={styles.quickPrompts}>
              {[
                { 
                  label: 'Gì ngọt cute', 
                  prompt: 'Gợi ý cho tớ món gì ngọt ngọt mà decor cute xíu để tớ nạp vitamin vui vẻ đi Boba Bot ơi! 🍬✨', 
                  color: Colors.peach 
                },
                { 
                  label: 'Món lên hình đẹp', 
                  prompt: 'Quán mình có món nào lên hình sống ảo cực nghệ không, tư vấn cho tớ một món để chụp story đẹp với! 📸🧋', 
                  color: Colors.lavn 
                },
                { 
                  label: 'Đang sale gì', 
                  prompt: 'Hôm nay quán mình có món nào đang được sale hoặc có deal hời gì không nhỉ, chỉ tớ với! 🏷️🔥', 
                  color: Colors.mint 
                },
                { 
                  label: 'Vegan / healthy', 
                  prompt: 'Tớ đang muốn uống gì đó healthy hoặc thuần chay (vegan) một chút, quán có món nào bớt béo mà vẫn ngon không gợi ý tớ nha! 🌿🍏', 
                  color: Colors.mint2 
                },
              ].map((p) => (
                <TouchableOpacity 
                  key={p.label} 
                  style={[styles.promptBtn, { backgroundColor: p.color }]}
                  onPress={() => handleSend(p.prompt)}
                >
                  <Text style={styles.promptText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {chatHistory.map((msg: any) => (
              <React.Fragment key={msg.id}>
                <View style={[
                  styles.messageBubble,
                  msg.type === 'user' ? styles.userBubble : styles.botBubble
                ]}>
                  <Text style={[
                    styles.messageText,
                    msg.type === 'user' ? styles.userText : styles.botText
                  ]}>{msg.text}</Text>
                </View>
                
                {/* Dynamic Suggestion Card - Only show if there are suggestions */}
                {msg.type === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                  <View style={styles.suggestionCard}>
                    <View style={styles.suggestionGrid}>
                      {msg.suggestions.map((item: any) => (
                        <View key={item._id} style={styles.suggestionItem}>
                          <Image 
                            source={{ uri: item.image || `https://images.unsplash.com/photo-1558857563-b371033873b8?w=200` }} 
                            style={styles.suggestionImg}
                          />
                          <Text style={styles.suggestionName} numberOfLines={2}>
                            {typeof item.name === 'string' ? item.name : (item.name?.['vi-VN'] || 'Món ngon')}
                          </Text>
                          <Text style={styles.suggestionPrice}>{item.price.toLocaleString()}đ</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.suggestionFooter}>
                      <View>
                        <Text style={styles.suggestionLabel}>Gợi ý từ AI ✨</Text>
                        <Text style={styles.suggestionTotal}>Boba Bot ❤️</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.pickBtn}
                        onPress={() => navigation.navigate('Menu')}
                      >
                        <Text style={styles.pickBtnText}>Xem Menu ➔</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </React.Fragment>
            ))}

            {isLoading && (
              <View style={[styles.messageBubble, styles.botBubble]}>
                <Text style={styles.messageText}>Đang suy nghĩ... ✨</Text>
              </View>
            )}
          </ScrollView>

          <View style={[
            styles.inputWrapper,
            isKeyboardVisible && { paddingBottom: 0 }
          ]}>
            <View style={styles.inputContainer}>
              <View style={styles.composer}>
                <TextInput 
                  placeholder="Nhắn cho Boba Bot..." 
                  style={styles.input}
                  value={message}
                  onChangeText={setMessage}
                  placeholderTextColor="rgba(26,26,26,0.4)"
                />
                <TouchableOpacity style={styles.emojiBtn}>
                  <Smile size={20} color={Colors.hot} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend()} disabled={isLoading}>
                  <Text style={styles.sendIcon}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>

        <BottomNav activeTab="chat" navigation={navigation} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 46,
    height: 46,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  botTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  botName: {
    fontFamily: Fonts.display800,
    fontSize: 16,
    color: Colors.ink,
  },
  botStatus: {
    fontFamily: Fonts.body600,
    fontSize: 10,
    color: Colors.ink,
    opacity: 0.7,
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  botAvatar: {
    width: 90,
    height: 90,
    borderRadius: 40,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: Colors.ink,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.hot,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.mint2,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontFamily: Fonts.display800,
    fontSize: 24,
    color: Colors.ink,
    marginTop: 15,
  },
  subGreeting: {
    fontFamily: Fonts.body500,
    fontSize: 14,
    color: Colors.ink,
    opacity: 0.7,
    marginTop: 5,
  },
  quickPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
    justifyContent: 'center',
  },
  promptBtn: {
    borderWidth: 2.5,
    borderColor: Colors.ink,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flex: 1,
    minWidth: '45%',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promptIcon: {
    fontSize: 18,
  },
  promptText: {
    fontFamily: Fonts.display700,
    fontSize: 12,
    color: Colors.ink,
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: Colors.ink,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
  },
  userBubble: {
    backgroundColor: Colors.ink,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  messageText: {
    fontFamily: Fonts.body500,
    fontSize: 14,
    lineHeight: 20,
  },
  botText: {
    color: Colors.ink,
  },
  userText: {
    color: '#fff',
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: Colors.ink,
    borderRadius: 28,
    padding: 18,
    marginTop: 15,
    marginLeft: 30,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  suggestionGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  suggestionItem: {
    flex: 1,
    alignItems: 'center',
  },
  suggestionImg: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: Colors.ink,
  },
  suggestionName: {
    fontFamily: Fonts.display800,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
    color: Colors.ink,
  },
  suggestionPrice: {
    fontFamily: Fonts.display800,
    fontSize: 12,
    color: Colors.hot,
  },
  suggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderStyle: 'dashed',
  },
  suggestionLabel: {
    fontFamily: Fonts.body700,
    fontSize: 10,
    color: Colors.ink,
    opacity: 0.6,
  },
  suggestionTotal: {
    fontFamily: Fonts.display800,
    fontSize: 16,
    color: Colors.ink,
  },
  saveText: {
    color: Colors.mint2,
    fontSize: 10,
  },
  pickBtn: {
    backgroundColor: Colors.mint,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  pickBtnText: {
    fontFamily: Fonts.display800,
    fontSize: 12,
    color: Colors.ink,
  },
  inputWrapper: {
    paddingBottom: Platform.OS === 'ios' ? 65 : 60, // Clear the BottomNav when keyboard is closed
    backgroundColor: 'transparent',
  },
  inputContainer: {
    padding: 15,
    backgroundColor: 'transparent',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mint,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.body600,
    fontSize: 14,
    color: Colors.ink,
  },
  emojiBtn: {
    padding: 5,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: Colors.hot,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendIcon: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  }
});
