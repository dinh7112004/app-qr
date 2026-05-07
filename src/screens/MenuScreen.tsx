import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Dimensions,
  SafeAreaView,
  Platform,
  Animated,
  PanResponder
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, ShoppingBag, Plus, MessageCircle, ArrowLeft, Heart, Bot, Flame, Sparkles, Tag, LayoutGrid, Star, Mic, Lock, Ticket, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Removed static import to prevent crash on Expo Go
import { Colors, Fonts } from '../theme';
import { Modal } from 'react-native';
import { clientApi, authApi } from '../api/client';
import { useCart } from '../context/CartContext';
import BottomNav from '../components/BottomNav';
import StatusModal from '../components/StatusModal';


const getTranslation = (obj: any, lang = 'vi-VN') => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj['vi-VN'] || '';
};


import { s, vs, ms, SCREEN_WIDTH, IS_TABLET } from '../utils/responsive';

export default function MenuScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { items, addItem, quote, isFavorite, toggleFavorite, setSession, session } = useCart();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [toppings, setToppings] = useState<any[]>([]);
  const [homeModules, setHomeModules] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [statusModal, setStatusModal] = useState<{ visible: boolean; type: 'success' | 'error' | 'info'; title: string; message: string }>({
    visible: false,
    type: 'info',
    title: '',
    message: ''
  });
  
  // Voice Search States
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const voiceScale = React.useRef(new Animated.Value(1)).current;
  
  // Draggable & Animated Bot
  const pan = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = React.useRef(new Animated.Value(1)).current;
  const botBottom = React.useRef(new Animated.Value(100)).current; // Default position

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      }
    })
  ).current;

  const { storeId, tableCode } = route.params || {};
 
  // Initialization and Polling
  React.useEffect(() => {
    const finalStoreId = storeId || session.storeId;
    const finalTableCode = tableCode || session.tableCode;

    if (finalStoreId && finalTableCode) {
      setSession(finalStoreId, finalTableCode);
    }
    
    if (!finalStoreId || !finalTableCode) {
      navigation.replace('Scan');
      return;
    }
    fetchMenu();
    clientApi.recordScan(finalStoreId, finalTableCode).catch((e: any) => console.log('Scan log skipped', e));
    
    // Poll data every 3 seconds for real-time updates
    const interval = setInterval(() => {
      fetchMenu(true);
    }, 3000);

    // Breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();

    return () => {
      clearInterval(interval);
    };
  }, [storeId, tableCode]);

  // Handle Bot Position Shift
  React.useEffect(() => {
    Animated.spring(botBottom, {
      toValue: items.length > 0 ? 190 : 100, // Move up if cart is visible
      useNativeDriver: false,
      friction: 8,
      tension: 40
    }).start();
  }, [items.length]);

  const startListening = async () => {
    // 1. Kiểm tra môi trường Expo Go một cách an toàn nhất
    // @ts-ignore
    const isExpoGo = global.__expo || global.Expo;
    
    if (isExpoGo) {
      setStatusModal({
        visible: true,
        type: 'info',
        title: 'Tính năng giới hạn',
        message: 'Sếp ơi, bản Expo Go hông hỗ trợ giọng nói. Sếp dùng tạm bàn phím nha, bản chính thức sẽ bao mượt ạ! 🎤✨'
      });
      return;
    }

    try {
      // Chỉ require khi chắc chắn hông phải Expo Go
      const Voice = require('@react-native-voice/voice').default;
      
      setRecognizedText('');
      setIsVoiceModalVisible(true);
      setIsListening(true);
      await Voice.start('vi-VN');
      
      // Pulse animation while listening
      Animated.loop(
        Animated.sequence([
          Animated.timing(voiceScale, { toValue: 1.5, duration: 600, useNativeDriver: true }),
          Animated.timing(voiceScale, { toValue: 1, duration: 600, useNativeDriver: true })
        ])
      ).start();
    } catch (e) {
      console.log('Voice Error:', e);
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Hông nghe thấy nè',
        message: 'Micro có chút vấn đề rồi sếp ơi, sếp thử lại sau nhé! 🎤'
      });
    }
  };

  const stopListening = async () => {
    try {
      const Voice = require('@react-native-voice/voice').default;
      await Voice.stop();
      setIsListening(false);
      if (recognizedText) {
        setSearchQuery(recognizedText);
        setTimeout(() => setIsVoiceModalVisible(false), 800);
      } else {
        setIsVoiceModalVisible(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMenu = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [menuData, contentData, profileData] = await Promise.all([
        clientApi.getMenu(storeId, tableCode),
        clientApi.getContent(storeId),
        authApi.getMe().catch(() => null)
      ]);
      setStoreInfo(menuData.store);
      setUserData(profileData);
      setCategories(menuData.categories || []);
      setMenuItems(menuData.items || []);
      setToppings(menuData.toppings || []);
      setHomeModules(contentData.modules || []);

      // Check for active orders if profile exists
      if (profileData && profileData.phone) {
        const ordersData = await clientApi.getOrders(profileData.phone);
        const ordersList = ordersData?.items || [];
        const processingOrder = ordersList.find((o: any) => 
          ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
        );
        if (processingOrder) {
          setActiveOrder(processingOrder);
        } else {
          setActiveOrder(null);
        }
      }

      // Fetch Vouchers
      const identifiers = profileData ? [profileData.phone, profileData._id].filter(Boolean).join(',') : '';
      const voucherData = await clientApi.getVouchers(identifiers).catch(() => ({ items: [] }));
      
      // Filter out already used vouchers but keep locked ones
      const availableVouchers = (voucherData.items || []).filter((v: any) => !v.isUsed);
      setVouchers(availableVouchers);
    } catch (error) {
      console.error('Fetch menu failed:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    if (!item.image) return false;
    if (item.isActive === false) return false;
    
    let matchesCategory = true;
    if (activeCategory === 'HOT') matchesCategory = item.tags?.includes('HOT');
    else if (activeCategory === 'NEW') matchesCategory = item.tags?.includes('NEW');
    else if (activeCategory === '-20%') matchesCategory = item.oldPrice && item.oldPrice > item.price;
    else if (activeCategory !== 'all') matchesCategory = item.category === activeCategory;
    
    const matchesSearch = getTranslation(item.name).toLowerCase().includes(searchQuery.toLowerCase()) || 
                         getTranslation(item.desc).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryName = (catCode: string) => {
    if (catCode === 'all') return { title: 'Tất cả', icon: null };
    if (catCode === 'HOT') return { title: 'Trending', icon: null };
    if (catCode === 'NEW') return { title: 'Món mới', icon: null };
    if (catCode === '-20%') return { title: 'Đang sale', icon: null };
    const cat = categories.find(c => c.code === catCode);
    return cat ? { title: getTranslation(cat.name), icon: null } : { title: 'Menu', icon: null };
  };

  const categoryDisplay = getCategoryName(activeCategory);


  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        {/* Container for everything BEFORE the sticky categories (Index 0) */}
        <View style={{ zIndex: 10 }}>
          {/* Header Gradient */}
          <LinearGradient
            colors={[Colors.hot, Colors.lavn, Colors.mint]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <SafeAreaView>
              <View style={styles.topRow}>
                <View style={styles.brandContainer}>
                  <Text style={styles.tableInfo}>BÀN {tableCode} • {storeInfo?.name || 'BOBA BABE'}</Text>
                  <View style={styles.brandRow}>
                    <Text style={styles.brandName}>
                      {userData?.displayName ? `Hi ${userData.displayName.split(' ')[0]}!` : 'Hi friend!'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.cartIconBtn} onPress={() => navigation.navigate('Cart', { storeId, tableCode })}>
                  <ShoppingBag size={24} color={Colors.ink} />
                  {items.length > 0 && (
                    <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>{items.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeText}>
                  {homeModules.find((m: any) => m.type === 'hero')?.sub || 'Hôm nay bạn muốn dùng gì?'}
                </Text>
              </View>

              <View style={styles.searchPadding}>
                <View style={styles.searchBar}>
                  <Search size={20} color={Colors.ink} opacity={0.3} />
                  <TextInput 
                    placeholder="Tìm món bạn khoái..." 
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="rgba(26,26,26,0.3)"
                  />
                  <TouchableOpacity style={styles.micBtn} onPress={startListening}>
                    <LinearGradient colors={[Colors.hot, Colors.hot2]} style={styles.micGradient}>
                      <Mic size={18} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Active Order Banner */}
          {activeOrder && (
            <TouchableOpacity 
              activeOpacity={0.7}
              style={styles.activeOrderBanner}
              onPress={() => navigation.navigate('OrderSuccess', { 
                orderId: activeOrder.orderId,
                total: activeOrder.total,
                tableCode: activeOrder.tableCode 
              })}
            >
              <LinearGradient colors={[Colors.hot, Colors.lavn]} style={[styles.activeOrderGradient, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }]}>
                <View style={styles.activeOrderContent}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.activeOrderText, { fontSize: 12 }]}>
                      Mã: <Text style={{ fontWeight: 'bold' }}>#{activeOrder.orderId ? activeOrder.orderId.slice(-4).toUpperCase() : '----'}</Text>
                    </Text>
                    <View style={{ width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 8 }} />
                    <Text style={[styles.activeOrderText, { fontSize: 12 }]}>
                      Trạng thái: <Text style={{ fontWeight: '600' }}>
                        {activeOrder.status === 'pending' && 'Đang chờ xác nhận...'}
                        {activeOrder.status === 'confirmed' && 'Đã nhận đơn'}
                        {activeOrder.status === 'preparing' && 'Đang chuẩn bị'}
                        {activeOrder.status === 'ready' && 'Sẵn sàng!'}
                      </Text>
                    </Text>
                  </View>
                  {/* Icon removed */}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Sticky Categories (Index 1) */}
        <View style={[
          styles.categoryStickyContainer,
          Platform.OS === 'ios' && { 
            paddingTop: insets.top + 5,
            marginTop: -(insets.top + 5), 
            backgroundColor: 'transparent', // Crucial: don't hide the banner
          }
        ]}>
          <View style={{ backgroundColor: Colors.paper, paddingBottom: 8 }}>
            <View style={styles.categorySticky}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            <TouchableOpacity 
              style={[
                styles.categoryBtn, 
                activeCategory === 'all' 
                  ? { backgroundColor: Colors.ink, borderBottomWidth: 2, transform: [{translateY: 2}] } 
                  : { backgroundColor: '#fff' }
              ]}
              onPress={() => setActiveCategory('all')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {/* LayoutGrid icon removed */}
                <Text style={[
                  styles.categoryBtnText, 
                  activeCategory === 'all' ? { color: '#fff', fontFamily: Fonts.display900 } : { color: Colors.ink }
                ]}>
                  Tất cả
                </Text>
              </View>
            </TouchableOpacity>

            {categories.filter(cat => cat.code?.toLowerCase() !== 'topping').map((cat, idx) => (
              <TouchableOpacity 
                key={cat._id || cat.code || `cat-${idx}`} 
                style={[
                  styles.categoryBtn, 
                  activeCategory === cat.code 
                    ? { backgroundColor: Colors.ink, borderBottomWidth: 2, transform: [{translateY: 2}] } 
                    : { backgroundColor: '#fff' }
                ]}
                onPress={() => setActiveCategory(cat.code)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[
                    styles.categoryBtnText, 
                    activeCategory === cat.code ? { color: '#fff', fontFamily: Fonts.display900 } : { color: Colors.ink }
                  ]}>
                    {getTranslation(cat.name)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>{categoryDisplay.title}</Text>
              <Text style={styles.sectionIcon}>{categoryDisplay.icon}</Text>
            </View>
            <Text style={styles.sectionStats}>{filteredItems.length} món ngon</Text>
          </View>

          <View style={styles.grid}>
            {filteredItems.map((item, index) => {
              const bgColors = [Colors.hot, Colors.mint, Colors.lavn, Colors.peach];
              const btnColor = item.color || bgColors[index % bgColors.length];
              
              let displayTags: string[] = [];
              if (item.tags && Array.isArray(item.tags)) {
                displayTags = item.tags.map((t: string) => t.toUpperCase());
              }
              if (item.oldPrice && item.oldPrice > item.price) {
                displayTags.push(`-${Math.round((1 - item.price/item.oldPrice)*100)}%`);
              }
              // Limit to max 2 tags to avoid breaking UI layout
              displayTags = displayTags.slice(0, 2);

              return (
                <TouchableOpacity 
                  key={item._id || item.id || `item-${index}`} 
                  style={styles.card}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.id, item })}
                >
                  {displayTags.map((tag: string, idx: number) => (
                    <View key={idx} style={[
                      styles.sticker, 
                      { 
                        top: -8, 
                        [idx === 0 ? 'left' : 'right']: -8, 
                        backgroundColor: tag === 'HOT' ? Colors.hot : (tag === 'NEW' ? Colors.mint : Colors.lavn),
                        transform: [{ rotate: idx === 0 ? '-5deg' : '5deg' }]
                      }
                    ]}>
                      <Text style={[styles.stickerText, { color: tag === 'HOT' ? '#fff' : Colors.ink }]}>{tag}</Text>
                    </View>
                  ))}
                  <View style={styles.cardImageContainer}>
                    <Image source={{ uri: item.image }} style={styles.cardImage} />
                    {isFavorite(item.id) && (
                      <TouchableOpacity 
                        style={styles.heartBtn}
                        onPress={() => toggleFavorite(item.id)}
                      >
                        <Heart size={16} color={Colors.hot} fill={Colors.hot} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.cardName} numberOfLines={2}>{getTranslation(item.name)}</Text>
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.cardPrice}>{(item.price / 1000).toLocaleString()}k</Text>
                      {item.oldPrice && <Text style={styles.cardOldPrice}>{(item.oldPrice / 1000).toLocaleString()}k</Text>}
                    </View>
                    <TouchableOpacity 
                      style={[styles.addBtn, { backgroundColor: btnColor }]}
                      onPress={() => addItem({ 
                        ...item, 
                        quantity: 1, 
                        selectedSize: 'v', 
                        selectedSweetness: '50%', 
                        selectedIce: '50% đá' 
                      })}
                    >
                      <Plus size={18} color={Colors.ink} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.sectionHeader, { marginTop: 30 }]}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Topping cute</Text>
              <Text style={styles.sectionIcon}></Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toppingList}>
            {toppings.map((top, idx) => (
              <TouchableOpacity 
                key={top.id || idx} 
                style={styles.toppingCard}
                onPress={() => alert(`Chọn một món trà sữa bất kỳ để thêm ${getTranslation(top.name)} nha bestie! 🍡`)}
              >
                <View style={styles.toppingImageContainer}>
                  {top.image ? (
                    <Image source={{ uri: top.image }} style={styles.toppingImage} />
                  ) : (
                    <Text style={[styles.toppingIcon, { color: top.color || Colors.hot }]}>{top.icon || '🍡'}</Text>
                  )}
                </View>
                <Text style={styles.toppingName} numberOfLines={1}>{getTranslation(top.name)}</Text>
                <Text style={styles.toppingPrice}>+{top.price / 1000}k</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={{ height: 220 }} />
        </View>
      </ScrollView>

      {/* Floating BobaBot assistant */}
      <Animated.View 
        {...panResponder.panHandlers}
        style={[
          styles.botFloating,
          {
            bottom: botBottom,
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scale }
            ]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.botButton}
          onPress={() => navigation.navigate('Chat', { storeId, tableCode })}
          activeOpacity={0.8}
        >
          <Bot size={35} color={Colors.hot} />
        </TouchableOpacity>
      </Animated.View>

      {items.length > 0 && (
        <View style={styles.cartFooterContainer}>
          <TouchableOpacity style={styles.cartFooter} onPress={() => navigation.navigate('Cart', { storeId, tableCode })}>
            <View style={styles.cartFooterLeft}>
              <View style={styles.cartCountBadge}>
                <Text style={styles.cartCountText}>{items.length}</Text>
              </View>
              <View>
                <Text style={styles.cartFooterSub}>{items.length} món đang chờ</Text>
                <Text style={styles.cartFooterTotal}>{quote?.total?.toLocaleString('vi-VN') || '0'}đ</Text>
              </View>
            </View>
            <View style={styles.cartFooterBtn}>
              <Text style={styles.cartFooterBtnText}>Xem giỏ hàng</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Voice Search Modal */}
      <Modal
        visible={isVoiceModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsVoiceModalVisible(false)}
      >
        <View style={styles.voiceModalContainer}>
          <View style={styles.voiceModalContent}>
            <TouchableOpacity style={styles.voiceCloseBtn} onPress={() => setIsVoiceModalVisible(false)}>
              <X size={24} color={Colors.ink} />
            </TouchableOpacity>
            
            <Text style={styles.voiceTitle}>Bạn ơi, nói món bạn thích đi!</Text>
            
            <View style={styles.voiceVisualizer}>
              <Animated.View style={[styles.voiceCircle, { transform: [{ scale: voiceScale }], opacity: 0.2 }]} />
              <Animated.View style={[styles.voiceCircle, { transform: [{ scale: Animated.multiply(voiceScale, 0.7) }], opacity: 0.4 }]} />
              <View style={styles.voiceMicIcon}>
                <Mic size={40} color="#fff" />
              </View>
            </View>

            <Text style={styles.voiceResultText}>
              {recognizedText || (isListening ? "Tớ đang lắng nghe sếp nè..." : "Nhấn để nói nha!")}
            </Text>

            {recognizedText ? (
              <TouchableOpacity style={styles.voiceSubmitBtn} onPress={stopListening}>
                <Text style={styles.voiceSubmitText}>Tìm món ngay! 🔍</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.voiceHint}>Ví dụ: &quot;Trà sữa nướng dừa&quot;, &quot;Trân châu đen&quot;...</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNav activeTab="home" navigation={navigation} />

      <StatusModal 
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const HeartIcon = ({ size, color }: any) => (
  <View style={styles.heartIcon}>
    <Heart size={size} color={color} fill={color} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  headerGradient: {
    paddingBottom: 15,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  welcomeTextContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  welcomeText: {
    fontFamily: Fonts.display800,
    fontSize: ms(22),
    color: '#fff',
    lineHeight: ms(28),
  },
  welcomeTextAccent: {
    fontFamily: Fonts.hand,
    fontSize: 28,
    color: Colors.peach,
  },
  micGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  brandContainer: {
    alignItems: 'flex-start',
    flex: 1,
  },
  tableInfo: {
    fontFamily: Fonts.body700,
    fontSize: 10,
    color: '#fff',
    opacity: 0.9,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  brandName: {
    fontFamily: Fonts.display800,
    fontSize: ms(32),
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  cartIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.hot,
    borderWidth: 2,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: Fonts.display800,
  },
  activeOrderBanner: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10, // Small gap
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: '#fff',
    zIndex: 999,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 4,
  },
  activeOrderGradient: {
    height: 44,
    borderRadius: 22,
  },
  activeOrderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeOrderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeOrderLabel: {
    fontFamily: Fonts.display900,
    fontSize: 10,
    color: '#fff',
    opacity: 0.6,
    letterSpacing: 0.5,
  },
  activeOrderText: {
    fontFamily: Fonts.display800,
    fontSize: 14,
    color: '#fff',
  },
  searchPadding: {
    paddingHorizontal: SCREEN_WIDTH > 350 ? 20 : 15,
    marginTop: SCREEN_WIDTH > 350 ? 15 : 10,
  },
  voucherSection: {
    marginTop: 25,
  },
  voucherList: {
    paddingHorizontal: 20,
    gap: 15,
    paddingBottom: 10,
  },
  voucherCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: Colors.ink,
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  voucherLocked: {
    backgroundColor: Colors.paper,
    borderColor: '#ddd',
    borderBottomWidth: 2,
  },
  voucherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voucherIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherInfo: {
    flex: 1,
  },
  voucherTitle: {
    fontFamily: Fonts.display800,
    fontSize: 16,
    color: Colors.ink,
  },
  voucherDesc: {
    fontFamily: Fonts.body600,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.5,
    marginTop: 2,
  },
  lockOverlay: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.hot,
  },
  lockProgressText: {
    fontFamily: Fonts.display800,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.4,
  },
  voucherBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: Colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  voucherBadgeText: {
    fontFamily: Fonts.display900,
    fontSize: 10,
    color: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.ink,
    paddingHorizontal: 15,
    height: SCREEN_WIDTH > 350 ? 56 : 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: Fonts.body600,
    fontSize: ms(14),
    color: Colors.ink,
  },
  micBtn: {
    backgroundColor: Colors.hot,
    width: SCREEN_WIDTH > 350 ? 34 : 28,
    height: SCREEN_WIDTH > 350 ? 34 : 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: SCREEN_WIDTH > 350 ? 16 : 14,
  },
  categoryStickyContainer: {
    backgroundColor: 'transparent',
    paddingTop: 5,
    paddingBottom: 5,
    zIndex: 1000,
  },
  categorySticky: {
    backgroundColor: 'transparent',
    paddingVertical: 8, // Slightly increased
  },
  categoryList: {
    paddingHorizontal: 15,
  },
  categoryBtn: {
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.ink,
    borderBottomWidth: 3, // Balanced 3D effect
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  categoryBtnText: {
    fontFamily: Fonts.display800,
    fontSize: 12, // The "Just Right" size
    color: Colors.ink,
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.display800,
    fontSize: 20,
    color: Colors.ink,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionStats: {
    fontFamily: Fonts.body700,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.5,
  },
  voiceModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  voiceModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    alignItems: 'center',
    minHeight: 400,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: Colors.ink,
  },
  voiceCloseBtn: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  voiceTitle: {
    fontFamily: Fonts.display800,
    fontSize: 22,
    color: Colors.ink,
    textAlign: 'center',
    marginTop: 10,
  },
  voiceVisualizer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  voiceCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.hot,
  },
  voiceMicIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.hot,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.ink,
  },
  voiceResultText: {
    fontFamily: Fonts.display700,
    fontSize: 20,
    color: Colors.ink,
    textAlign: 'center',
    minHeight: 60,
    paddingHorizontal: 20,
  },
  voiceHint: {
    fontFamily: Fonts.body600,
    fontSize: 14,
    color: Colors.ink,
    opacity: 0.4,
    marginTop: 10,
  },
  voiceSubmitBtn: {
    backgroundColor: Colors.ink,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  voiceSubmitText: {
    fontFamily: Fonts.display900,
    fontSize: 16,
    color: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: IS_TABLET ? (SCREEN_WIDTH - s(80)) / 3 : (SCREEN_WIDTH - s(55)) / 2,
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    padding: 12,
    marginBottom: 20,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 6,
  },
  sticker: {
    position: 'absolute',
    zIndex: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderStyle: 'dashed',
  },
  stickerText: {
    fontFamily: Fonts.display800,
    fontSize: 10,
  },
  cardImageContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 125,
  },
  heartBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardName: {
    fontFamily: Fonts.display800,
    fontSize: 14,
    color: Colors.ink,
    marginTop: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  cardPrice: {
    fontFamily: Fonts.display800,
    fontSize: 18,
    color: Colors.hot,
  },
  cardOldPrice: {
    fontFamily: Fonts.body500,
    fontSize: 11,
    color: Colors.ink,
    opacity: 0.4,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
  },
  toppingList: {
    paddingVertical: 8,
  },
  toppingCard: {
    width: 110,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    padding: 12,
    alignItems: 'center',
    marginRight: 15,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  toppingImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.paper,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toppingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  toppingIcon: {
    fontSize: 32,
  },
  toppingName: {
    fontFamily: Fonts.display800,
    fontSize: 11,
    color: Colors.ink,
    marginTop: 8,
  },
  toppingPrice: {
    fontFamily: Fonts.display800,
    fontSize: 11,
    color: Colors.hot,
  },
  botButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: Colors.ink,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  botImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cartFooterContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  cartFooter: {
    backgroundColor: Colors.ink,
    borderRadius: 28,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: Colors.ink,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  cartFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  cartCountBadge: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: Colors.hot,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: {
    color: '#fff',
    fontFamily: Fonts.display800,
    fontSize: 20,
  },
  cartFooterSub: {
    fontFamily: Fonts.body700,
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
  },
  cartFooterTotal: {
    fontFamily: Fonts.display800,
    fontSize: 18,
    color: '#fff',
  },
  cartFooterBtn: {
    backgroundColor: Colors.hot,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  cartFooterBtnText: {
    color: '#fff',
    fontFamily: Fonts.display800,
    fontSize: 15,
  },
  botFloating: {
    position: 'absolute',
    right: 30, // Increased from 20 to move it away from the edge/profile tab
    width: 70,
    height: 70,
    zIndex: 9999,
  },
});
