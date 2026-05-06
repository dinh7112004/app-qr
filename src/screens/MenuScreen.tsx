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
import { Search, ShoppingBag, Plus, MessageCircle, ArrowLeft, Heart, Bot, Flame, Sparkles, Tag, LayoutGrid, Star, Mic, Lock, Ticket } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../theme';
import { clientApi, authApi } from '../api/client';
import { useCart } from '../context/CartContext';
import BottomNav from '../components/BottomNav';


const getTranslation = (obj: any, lang = 'vi-VN') => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj['vi-VN'] || '';
};


const { width } = Dimensions.get('window');

export default function MenuScreen({ route, navigation }: any) {
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
  
  // Draggable & Animated Bot
  const pan = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = React.useRef(new Animated.Value(1)).current;

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
    
    // Poll data every 5 seconds for real-time updates
    const interval = setInterval(() => {
      fetchMenu(true);
    }, 5000);

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

    return () => clearInterval(interval);
  }, [storeId, tableCode]);

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
    if (catCode === 'all') return { title: 'Tất cả', icon: <LayoutGrid size={18} color="inherit" /> };
    if (catCode === 'HOT') return { title: 'Trending', icon: <Flame size={18} color="inherit" /> };
    if (catCode === 'NEW') return { title: 'Món mới', icon: <Sparkles size={18} color="inherit" /> };
    if (catCode === '-20%') return { title: 'Đang sale', icon: <Tag size={18} color="inherit" /> };
    const cat = categories.find(c => c.code === catCode);
    return cat ? { title: getTranslation(cat.name), icon: null } : { title: 'Menu', icon: null };
  };

  const categoryDisplay = getCategoryName(activeCategory);


  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        {/* Header Gradient */}
        <LinearGradient 
          colors={[Colors.hot, Colors.lavn, Colors.mint]} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView>
            <View style={styles.topRow}>
              <View style={styles.brandContainer}>
                <Text style={styles.tableInfo}>BÀN {tableCode} • {storeInfo?.name || 'BOBA BABE'}</Text>
                <View style={styles.brandRow}>
                  <Text style={styles.brandName}>
                    {userData?.displayName ? `Hi ${userData.displayName.split(' ')[0]}!` : 'Hi friend!'}
                  </Text>
                  <Sparkles size={20} color="#fff" />
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
                <Search size={20} color={Colors.ink} opacity={0.4} />
                <TextInput 
                  placeholder="Tìm món ngon ngay..." 
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <TouchableOpacity style={styles.micBtn}>
                  <Mic size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Active Order Banner */}
        {activeOrder && (
          <TouchableOpacity 
            style={styles.activeOrderBanner}
            onPress={() => navigation.navigate('OrderSuccess', { orderId: activeOrder.orderId })}
          >
            <LinearGradient
              colors={[Colors.hot, Colors.lavn]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activeOrderGradient}
            >
              <View style={styles.activeOrderContent}>
                <View style={styles.statusDot} />
                <Text style={styles.activeOrderText}>
                  Đơn <Text style={{ fontFamily: Fonts.display800 }}>#{activeOrder.orderId.slice(-4)}</Text> đang được chuẩn bị nha! ✨
                </Text>
              </View>
              <ArrowLeft size={16} color="#fff" style={{ transform: [{ rotate: '180deg' }] }} />
            </LinearGradient>
          </TouchableOpacity>
        )}


        {/* Sticky Categories */}
        <View style={styles.categorySticky}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {[
              { id: 'all', label: 'Tất cả', Icon: LayoutGrid, color: Colors.ink, textColor: '#fff' },
              { id: 'HOT', label: 'HOT', Icon: Flame, color: Colors.hot, textColor: '#fff' },
              { id: 'NEW', label: 'Mới', Icon: Sparkles, color: Colors.mint, textColor: Colors.ink },
              { id: '-20%', label: 'Sale', Icon: Tag, color: Colors.lavn, textColor: Colors.ink },
            ].map((filter) => (
              <TouchableOpacity 
                key={filter.id} 
                style={[
                  styles.categoryBtn, 
                  activeCategory === filter.id ? { backgroundColor: filter.color } : { backgroundColor: '#fff' }
                ]}
                onPress={() => setActiveCategory(filter.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <filter.Icon size={16} color={activeCategory === filter.id ? filter.textColor : Colors.ink} />
                  <Text style={[
                    styles.categoryBtnText, 
                    activeCategory === filter.id ? { color: filter.textColor } : { color: Colors.ink }
                  ]}>
                    {filter.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
                  key={item.id} 
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
              <Text style={styles.sectionIcon}>🍡</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toppingList}>
            {toppings.map((top, idx) => (
              <TouchableOpacity 
                key={top.id || idx} 
                style={styles.toppingCard}
                onPress={() => alert(`Chọn một món trà sữa bất kỳ để thêm ${getTranslation(top.name)} nha bestie! ✨`)}
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

      {/* Floating Draggable Bot */}
      <Animated.View 
        style={[
          styles.botFloating,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scale }
            ]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Chat')}
          style={styles.botButton}
        >
          <Bot size={36} color={Colors.hot} />
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
                <Text style={styles.cartFooterTotal}>{quote?.total?.toLocaleString('vi-VN') || '...'}đ</Text>
              </View>
            </View>
            <View style={styles.cartFooterBtn}>
              <Text style={styles.cartFooterBtnText}>Xem giỏ hàng</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab="home" navigation={navigation} />
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
    paddingBottom: 25,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  welcomeTextContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  welcomeText: {
    fontFamily: Fonts.display800,
    fontSize: 22,
    color: '#fff',
    lineHeight: 28,
  },
  welcomeTextAccent: {
    fontFamily: Fonts.hand,
    fontSize: 28,
    color: Colors.peach,
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
    fontSize: 32,
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
    marginTop: -15,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.ink,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 4,
  },
  activeOrderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  activeOrderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  activeOrderText: {
    fontFamily: Fonts.body700,
    fontSize: 13,
    color: '#fff',
  },
  searchPadding: {
    paddingHorizontal: width > 350 ? 20 : 15,
    marginTop: width > 350 ? 20 : 15,
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
    height: width > 350 ? 56 : 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: Fonts.body600,
    fontSize: width > 350 ? 14 : 13,
    color: Colors.ink,
  },
  micBtn: {
    backgroundColor: Colors.hot,
    width: width > 350 ? 34 : 28,
    height: width > 350 ? 34 : 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: width > 350 ? 16 : 14,
  },
  categorySticky: {
    backgroundColor: Colors.paper,
    paddingVertical: width > 350 ? 18 : 12,
    borderBottomWidth: 2,
    borderBottomColor: Colors.ink,
  },
  categoryList: {
    paddingHorizontal: 15,
  },
  categoryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  categoryBtnActive: {
    backgroundColor: Colors.ink,
  },
  categoryBtnText: {
    fontFamily: Fonts.display700,
    fontSize: 13,
    color: Colors.ink,
  },
  categoryBtnTextActive: {
    color: '#fff',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 55) / 2,
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
    bottom: 250,
    right: 20,
    width: 70,
    height: 70,
    zIndex: 9999,
  },
});
