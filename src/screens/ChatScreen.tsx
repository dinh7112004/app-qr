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

export default function ChatScreen({ navigation }: any) {
  const [message, setMessage] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const messages = [
    { id: '1', type: 'bot', text: 'Chào bạn!' },
    { id: '2', type: 'bot', text: 'Hôm nay bạn muốn uống gì nào?' },
    { id: '3', type: 'user', text: '3 đứa bọn tớ, có gì hot mà chụp story đẹp ko?' },
    { id: '4', type: 'bot', text: 'Có liền nè! Tớ gợi ý combo này đảm bảo lên hình cực xinh luôn:' },
  ];

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

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
          <TouchableOpacity style={styles.headerBtn}>
            <Mic size={24} color={Colors.ink} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            style={styles.chatArea} 
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
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
                { text: 'Gì ngọt cute', color: Colors.peach },
                { text: 'Món lên hình đẹp', color: Colors.lavn },
                { text: 'Đang sale gì', color: Colors.mint },
                { text: 'Vegan / healthy', color: Colors.mint2 },
              ].map((p) => (
                <TouchableOpacity key={p.text} style={[styles.promptBtn, { backgroundColor: p.color }]}>
                  <Text style={styles.promptText}>{p.text}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {messages.map((msg) => (
              <View key={msg.id} style={[
                styles.messageBubble,
                msg.type === 'user' ? styles.userBubble : styles.botBubble
              ]}>
                <Text style={[
                  styles.messageText,
                  msg.type === 'user' ? styles.userText : styles.botText
                ]}>{msg.text}</Text>
              </View>
            ))}

            {/* Suggestion Card */}
            <View style={styles.suggestionCard}>
              <View style={styles.suggestionGrid}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.suggestionItem}>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=200' }} 
                      style={styles.suggestionImg}
                    />
                    <Text style={styles.suggestionName}>Trà sữa{'\n'}hoàng kim</Text>
                    <Text style={styles.suggestionPrice}>39k</Text>
                  </View>
                ))}
              </View>
              <View style={styles.suggestionFooter}>
                <View>
                  <Text style={styles.suggestionLabel}>Combo 3 món</Text>
                  <Text style={styles.suggestionTotal}>126k <Text style={styles.saveText}>tiết kiệm 8k</Text></Text>
                </View>
                <TouchableOpacity style={styles.pickBtn}>
                  <Text style={styles.pickBtnText}>Chốt liền ❤️</Text>
                </TouchableOpacity>
              </View>
            </View>
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
                <TouchableOpacity style={styles.sendBtn}>
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
