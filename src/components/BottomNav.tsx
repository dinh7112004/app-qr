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
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    borderTopWidth: 2,
    borderColor: Colors.ink,
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '25%',
  },
  navText: {
    fontFamily: Fonts.display700,
    fontSize: 10,
    color: Colors.ink,
    marginTop: 4,
  },
  activeText: {
    color: Colors.hot,
  }
});
