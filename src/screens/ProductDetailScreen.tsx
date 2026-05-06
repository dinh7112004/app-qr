import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Dimensions,
  Platform,
  Modal
} from 'react-native';
import { ArrowLeft, Heart, Share2, Star, Clock, Camera, Minus, Plus, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../theme';
import { useCart } from '../context/CartContext';
import { clientApi } from '../api/client';
import { ActivityIndicator } from 'react-native';


const getTranslation = (obj: any, lang = 'vi-VN') => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj['vi-VN'] || '';
};


const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ navigation, route }: any) {
  const { addItem, toggleFavorite, isFavorite } = useCart();
  const { productId, item: initialItem } = route.params || {};
  const [qty, setQty] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [item, setItem] = React.useState<any>(initialItem);
  
  // Selection States
  const [selectedSize, setSelectedSize] = React.useState('v'); // Default to 'Vừa'
  const [selectedSweetness, setSelectedSweetness] = React.useState('50%');
  const [selectedIce, setSelectedIce] = React.useState('50% đá');
  const [selectedToppings, setSelectedToppings] = React.useState<string[]>([]);
  const [apiToppings, setApiToppings] = React.useState<any[]>([]);
  const [reviewsModalVisible, setReviewsModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (productId) {
      fetchItemDetail();
    } else if (initialItem) {
      setLoading(false);
    }
  }, [productId]);

  const fetchItemDetail = async () => {
    try {
      setLoading(true);
      const [itemData, menuData] = await Promise.all([
        clientApi.getItemDetail(productId),
        clientApi.getMenu('store-genz-01')
      ]);
      setItem(itemData);
      setApiToppings(menuData.toppings || []);
      
      // Select first topping by default if available
      if (menuData.toppings && menuData.toppings.length > 0) {
        setSelectedToppings([menuData.toppings[0].id]);
      }
    } catch (error) {
      console.error('Fetch item detail failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.hot} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.name}>Món này hết vibe rùi... 😢</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerBtn, { marginTop: 20 }]}>
          <ArrowLeft size={24} color={Colors.ink} />
        </TouchableOpacity>
      </View>
    );
  }

  const product = {
    name: getTranslation(item.name),
    price: item.price || 0,
    oldPrice: item.oldPrice,
    category: item.categoryName || 'Trà sữa • #1 bestie',
    vibe: getTranslation(item.desc) || '"vibe siêu cute, ngọt vừa thôi nha"',
    description: getTranslation(item.desc),
    image: item.image,
    rating: item.rating || 5.0,
    reviews: item.reviewCount || 0,
    reviewsData: item.reviews || [],
    stories: '1.2k story',
    sizes: [
      { id: 'm', name: 'Mini', sub: '300ml', price: 0, icon: '🥤' },
      { id: 'v', name: 'Vừa', sub: '500ml', price: 0, icon: '🧋' },
      { id: 'x', name: 'XXL', sub: '700ml', price: 10000, icon: '🥛' },
    ],
    sweetness: ['0%', '25%', '50%', '75%', '100%'],
    ice: ['0% đá', '50% đá', '100% đá'],
    toppings: apiToppings.map(t => ({
      id: t.id,
      name: getTranslation(t.name),
      price: t.price,
      icon: t.icon || '🍡',
      image: t.image
    }))
  };

  const currentSizePrice = product.sizes.find(s => s.id === selectedSize)?.price || 0;
  const currentToppingsPrice = product.toppings
    .filter(t => selectedToppings.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);
  const totalPrice = (product.price + currentSizePrice + currentToppingsPrice) * qty;

  const toggleTopping = (id: string) => {
    setSelectedToppings(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Hero */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: product.image }} style={styles.heroImage} />
          <LinearGradient 
            colors={['rgba(0,0,0,0.3)', 'transparent', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <ArrowLeft size={24} color={Colors.ink} />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerBtn}>
                <Camera size={22} color={Colors.ink} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerBtn}
                onPress={() => item && toggleFavorite(item._id || item.id)}
              >
                <Heart 
                  size={22} 
                  color={Colors.hot} 
                  fill={isFavorite(item._id || item.id) ? Colors.hot : 'transparent'} 
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Hero Stickers */}
          <View style={styles.heroStickers}>
            <View style={[styles.heroSticker, { backgroundColor: Colors.hot }]}>
              <Text style={styles.heroStickerText}>BESTSELLER 🔥</Text>
            </View>
            <View style={[styles.heroSticker, { backgroundColor: Colors.mint, transform: [{ rotate: '4deg' }] }]}>
              <Text style={[styles.heroStickerText, { color: Colors.ink }]}>3 mins 🕒</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.categoryLabel}>{product.category}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.vibeText}>{product.vibe}</Text>

          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => setReviewsModalVisible(true)}
            >
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.statText}>{product.rating}</Text>
              <Text style={styles.statSub}>({product.reviews}) &gt;</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Camera size={14} color={Colors.ink} opacity={0.6} />
              <Text style={styles.statSub}>{product.stories}</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>{(product.price || 0).toLocaleString('vi-VN')}đ</Text>
            {product.oldPrice && (
              <>
                <Text style={styles.oldPrice}>{product.oldPrice.toLocaleString('vi-VN')}đ</Text>
                <View style={styles.saleTag}>
                  <Text style={styles.saleTagText}>SALE!</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.divider} />

          {/* Size Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Size cốc</Text>
              <View style={styles.requiredSticker}>
                <Text style={styles.requiredText}>PHẢI CHỌN</Text>
              </View>
            </View>
            <View style={styles.sizeGrid}>
              {product.sizes.map((size) => {
                const isActive = selectedSize === size.id;
                return (
                  <TouchableOpacity 
                    key={size.id} 
                    onPress={() => setSelectedSize(size.id)}
                    style={[styles.sizeCard, isActive && styles.sizeCardActive]}
                  >
                    {isActive && <View style={styles.pickSticker}><Text style={styles.pickText}>PICK!</Text></View>}
                    <Text style={styles.sizeIcon}>{size.icon}</Text>
                    <Text style={[styles.sizeName, isActive && styles.sizeNameActive]}>{size.name}</Text>
                    <Text style={[styles.sizeSub, isActive && styles.sizeSubActive]}>{size.sub}</Text>
                    {size.price > 0 && <Text style={[styles.sizePrice, isActive && styles.sizePriceActive]}>+{size.price / 1000}k</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sweetness */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ngọt bao nhiêu? 🍭</Text>
            <View style={styles.sweetnessRow}>
              {product.sweetness.map((s) => {
                const isActive = selectedSweetness === s;
                return (
                  <TouchableOpacity 
                    key={s} 
                    onPress={() => setSelectedSweetness(s)}
                    style={[styles.sweetnessBtn, isActive && styles.sweetnessBtnActive]}
                  >
                    <Text style={[styles.sweetnessText, isActive && styles.sweetnessTextActive]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Ice Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đá bao nhiêu? 🧊</Text>
            <View style={styles.sweetnessRow}>
              {product.ice.map((i) => {
                const isActive = selectedIce === i;
                return (
                  <TouchableOpacity 
                    key={i} 
                    onPress={() => setSelectedIce(i)}
                    style={[styles.sweetnessBtn, isActive && styles.sweetnessBtnActive]}
                  >
                    <Text style={[styles.sweetnessText, isActive && styles.sweetnessTextActive]}>{i}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Toppings */}
          {product.toppings.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Topping cute 🍡</Text>
                <Text style={styles.limitText}>(max 3)</Text>
              </View>
              <View style={styles.toppingList}>
                {product.toppings.map((top) => {
                  const isActive = selectedToppings.includes(top.id);
                  return (
                    <TouchableOpacity 
                      key={top.id} 
                      onPress={() => toggleTopping(top.id)}
                      style={[styles.toppingRow, isActive && styles.toppingRowActive]}
                    >
                      <View style={styles.toppingInfo}>
                        <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
                          {isActive && <Text style={styles.checkMark}>✓</Text>}
                        </View>
                        <View style={styles.toppingSmallImageContainer}>
                          {top.image ? (
                            <Image source={{ uri: top.image }} style={styles.toppingSmallImage} />
                          ) : (
                            <Text style={styles.toppingIcon}>{top.icon}</Text>
                          )}
                        </View>
                        <Text style={styles.toppingName}>{top.name}</Text>
                      </View>
                      <Text style={styles.toppingPrice}>+{top.price / 1000}k</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Add to Cart Footer */}
      <View style={styles.footer}>
        <View style={styles.qtyContainer}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(Math.max(1, qty - 1))}>
            <Minus size={20} color={Colors.ink} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{qty}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(qty + 1)}>
            <Plus size={20} color={Colors.ink} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.addToCartBtn}
          onPress={() => {
            addItem({
              id: item._id || item.id,
              name: product.name,
              price: product.price + currentSizePrice + currentToppingsPrice,
              image: product.image,
              quantity: qty,
              selectedSize: selectedSize,
              selectedSweetness: selectedSweetness,
              selectedIce: selectedIce,
              toppingLabels: product.toppings.filter(t => selectedToppings.includes(t.id)).map(t => t.name),
              selectedToppings: selectedToppings
            });
            navigation.navigate('Cart');
          }}
        >
          <LinearGradient
            colors={[Colors.hot, '#FF5252']}
            style={styles.addToCartGradient}
          >
            <Text style={styles.addToCartLabel}>Cho vào giỏ</Text>
            <Text style={styles.addToCartPrice}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Reviews Modal */}
      <Modal visible={reviewsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đánh giá ({product.reviews})</Text>
              <TouchableOpacity onPress={() => setReviewsModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color={Colors.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {product.reviewsData.length === 0 ? (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Text style={{ fontFamily: Fonts.body600, color: '#999', fontSize: 16 }}>Chưa có đánh giá nào nà... 🥺</Text>
                </View>
              ) : (
                product.reviewsData.map((review: any) => (
                  <View key={review._id} style={styles.reviewCard}>
                    <View style={styles.reviewHeaderRow}>
                      <Text style={styles.reviewCustomer}>{review.customerName}</Text>
                      <View style={{ flexDirection: 'row' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} color={i < review.rating ? Colors.hot : '#ccc'} fill={i < review.rating ? Colors.hot : 'transparent'} />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</Text>
                    {review.comment ? (
                      <Text style={styles.reviewComment}>&quot;{review.comment}&quot;</Text>
                    ) : null}
                    
                    {review.merchantReply && (
                      <View style={styles.merchantReplyBox}>
                        <Text style={styles.merchantReplyTitle}>Quán trả lời:</Text>
                        <Text style={styles.merchantReplyText}>{review.merchantReply}</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  heroContainer: {
    width: width,
    height: 380,
    backgroundColor: Colors.hot,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  headerRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    shadowOpacity: 0.15,
    shadowRadius: 0,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStickers: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    gap: 10,
  },
  heroSticker: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    borderStyle: 'dashed',
    transform: [{ rotate: '-4deg' }],
  },
  heroStickerText: {
    fontFamily: Fonts.display800,
    fontSize: 12,
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    marginTop: -35,
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    borderTopWidth: 2.5,
    borderTopColor: Colors.ink,
  },
  categoryLabel: {
    fontFamily: Fonts.display800,
    fontSize: 12,
    color: Colors.hot,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: Fonts.display800,
    fontSize: 28,
    color: Colors.ink,
    marginTop: 5,
  },
  vibeText: {
    fontFamily: Fonts.body600,
    fontStyle: 'italic',
    fontSize: 18,
    color: Colors.hot,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: Colors.ink,
  },
  statText: {
    fontFamily: Fonts.display800,
    fontSize: 13,
    color: Colors.ink,
  },
  statSub: {
    fontFamily: Fonts.body600,
    fontSize: 11,
    color: Colors.ink,
    opacity: 0.5,
  },
  priceContainer: {
    backgroundColor: Colors.mint,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    padding: 18,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  price: {
    fontFamily: Fonts.display800,
    fontSize: 32,
    color: Colors.ink,
  },
  oldPrice: {
    fontFamily: Fonts.body600,
    fontSize: 16,
    color: Colors.ink,
    opacity: 0.4,
    textDecorationLine: 'line-through',
  },
  saleTag: {
    marginLeft: 'auto',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.hot,
    transform: [{ rotate: '4deg' }],
  },
  saleTagText: {
    fontFamily: Fonts.display800,
    fontSize: 10,
    color: Colors.hot,
  },
  divider: {
    height: 2,
    backgroundColor: Colors.ink,
    opacity: 0.05,
    marginVertical: 25,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontFamily: Fonts.display800,
    fontSize: 18,
    color: Colors.ink,
  },
  requiredSticker: {
    backgroundColor: Colors.hot,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    borderStyle: 'dashed',
    transform: [{ rotate: '-4deg' }],
  },
  requiredText: {
    fontFamily: Fonts.display800,
    fontSize: 9,
    color: '#fff',
  },
  sizeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  sizeCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    padding: 14,
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  sizeCardActive: {
    backgroundColor: Colors.hot,
  },
  pickSticker: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.ink,
    transform: [{ rotate: '12deg' }],
    zIndex: 10,
  },
  pickText: {
    fontFamily: Fonts.display800,
    fontSize: 8,
    color: Colors.ink,
  },
  sizeIcon: {
    fontSize: 24,
  },
  sizeName: {
    fontFamily: Fonts.display800,
    fontSize: 14,
    color: Colors.ink,
    marginTop: 5,
  },
  sizeNameActive: {
    color: '#fff',
  },
  sizeSub: {
    fontFamily: Fonts.body600,
    fontSize: 10,
    color: Colors.ink,
    opacity: 0.5,
  },
  sizeSubActive: {
    color: '#fff',
    opacity: 0.9,
  },
  sizePrice: {
    fontFamily: Fonts.display800,
    fontSize: 11,
    color: Colors.hot,
    marginTop: 2,
  },
  sizePriceActive: {
    color: '#fff',
  },
  sweetnessRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sweetnessBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sweetnessBtnActive: {
    backgroundColor: Colors.hot,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
  },
  sweetnessText: {
    fontFamily: Fonts.display700,
    fontSize: 13,
    color: Colors.ink,
  },
  sweetnessTextActive: {
    color: '#fff',
  },
  limitText: {
    fontFamily: Fonts.body700,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.5,
  },
  toppingList: {
    gap: 12,
  },
  toppingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: Colors.ink,
  },
  toppingRowActive: {
    backgroundColor: Colors.mint,
  },
  toppingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.ink,
  },
  checkMark: {
    color: '#fff',
    fontWeight: 'bold',
  },
  toppingSmallImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.paper,
  },
  toppingSmallImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  toppingIcon: {
    fontSize: 20,
  },
  toppingName: {
    fontFamily: Fonts.display700,
    fontSize: 14,
    color: Colors.ink,
  },
  toppingPrice: {
    fontFamily: Fonts.display800,
    fontSize: 14,
    color: Colors.ink,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.paper,
    borderTopWidth: 2.5,
    borderTopColor: Colors.ink,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    flexDirection: 'row',
    gap: 15,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.mint,
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 15,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontFamily: Fonts.display800,
    fontSize: 18,
    width: 25,
    textAlign: 'center',
  },
  addToCartBtn: {
    flex: 1,
    height: 64,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: Colors.ink,
  },
  addToCartGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartLabel: {
    fontFamily: Fonts.display800,
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  addToCartPrice: {
    fontFamily: Fonts.display900,
    fontSize: 16,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 15,
  },
  modalTitle: {
    fontFamily: Fonts.display900,
    fontSize: 22,
    color: Colors.ink,
  },
  closeBtn: {
    padding: 5,
    backgroundColor: '#eee',
    borderRadius: 20,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewCustomer: {
    fontFamily: Fonts.display800,
    fontSize: 15,
    color: Colors.ink,
  },
  reviewDate: {
    fontFamily: Fonts.body600,
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  reviewComment: {
    fontFamily: Fonts.body600,
    fontSize: 14,
    color: Colors.ink,
    lineHeight: 20,
  },
  merchantReplyBox: {
    marginTop: 12,
    backgroundColor: Colors.peach,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.hot,
  },
  merchantReplyTitle: {
    fontFamily: Fonts.display800,
    fontSize: 12,
    color: Colors.ink,
    marginBottom: 4,
  },
  merchantReplyText: {
    fontFamily: Fonts.body600,
    fontSize: 13,
    color: Colors.ink,
  },
});
