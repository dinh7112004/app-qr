import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Home, History, User, MessageCircle } from 'lucide-react-native';
import { Colors, Fonts } from '../theme';

export default function BottomNav({ activeTab, navigation }: { activeTab: string, navigation: any }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Menu')}
      >
        <Home size={24} color={activeTab === 'home' ? Colors.hot : Colors.ink} />
        <Text style={[styles.navText, activeTab === 'home' && styles.activeText]}>Trang chủ</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('OrderHistory')}
      >
        <History size={24} color={activeTab === 'orders' ? Colors.hot : Colors.ink} />
        <Text style={[styles.navText, activeTab === 'orders' && styles.activeText]}>Lịch sử</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Chat')}
      >
        <MessageCircle size={24} color={activeTab === 'chat' ? Colors.hot : Colors.ink} />
        <Text style={[styles.navText, activeTab === 'chat' && styles.activeText]}>Boba Bot</Text>
      </TouchableOpacity>



      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Profile')}
      >
        <User size={24} color={activeTab === 'profile' ? Colors.hot : Colors.ink} />
        <Text style={[styles.navText, activeTab === 'profile' && styles.activeText]}>Cá nhân</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 0,
    marginBottom: 0,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: Colors.ink,
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    flex: 1,
  },
  navText: {
    fontFamily: Fonts.display800,
    fontSize: 9,
    color: Colors.ink,
    marginTop: 2,
    opacity: 0.4,
  },
  activeText: {
    color: Colors.hot,
    opacity: 1,
  }
});
