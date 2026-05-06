import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { ArrowLeft, Clock, ChevronRight, ShoppingBag, ReceiptText, MapPin, Star, FileText, Flame, Coffee, CheckCircle, HelpCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../theme';
import { clientApi, authApi } from '../api/client';
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');

export default function OrderHistoryScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [ratedOrders, setRatedOrders] = useState<Set<string>>(new Set());

  const fetchOrders = async () => {
    try {
      const profile = await authApi.getMe().catch(() => null);
      if (profile) {
        const identifiers = [profile.phone, profile._id].filter(Boolean).join(',');
        const data = await clientApi.getOrders(identifiers);
        setOrders(Array.isArray(data.items) ? data.items : []);
      }
    } catch (error) {
      console.error('Fetch orders failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { bg: Colors.lavn, text: Colors.ink, label: 'Đã nhận đơn', Icon: FileText };
      case 'confirmed': return { bg: Colors.mint, text: Colors.ink, label: 'Đang làm', Icon: Flame };
      case 'ready': return { bg: Colors.peach, text: Colors.ink, label: 'Chờ lấy', Icon: Coffee };
      case 'completed': return { bg: Colors.ink, text: '#fff', label: 'Hoàn tất', Icon: CheckCircle };
      default: return { bg: '#eee', text: Colors.ink, label: status, Icon: HelpCircle };
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedOrderId || rating === 0) return;
    
    try {
      await fetch('https://backend-qr-h4th.onrender.com/client/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: 'store-genz-01',
          orderId: selectedOrderId,
          rating,
          comment: reviewComment,
          customerName: 'Gen-Z Customer'
        })
      });
      setRatedOrders(prev => new Set(prev).add(selectedOrderId));
      setReviewModalVisible(false);
      setRating(0);
      setReviewComment('');
    } catch (e) {
      console.log('Lỗi gửi đánh giá:', e);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.hot} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={[Colors.hot, Colors.lavn]} 
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Nhật ký Order ✨</Text>
              <Text style={styles.headerSubtitle}>{orders.length} lần chill cùng Boba Babe</Text>
            </View>
            <View style={{ width: 45 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.hot} colors={[Colors.hot]} />}
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ShoppingBag size={80} color={Colors.ink} opacity={0.05} style={{ marginBottom: 20 }} />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào nè... 😢</Text>
            <Text style={styles.emptySubText}>Làm ngay một ly trà sữa cho đời thêm tươi thôii!</Text>
            <TouchableOpacity 
              style={styles.orderNowBtn}
              onPress={() => navigation.navigate('Menu')}
            >
              <LinearGradient
                colors={[Colors.ink, '#333']}
                style={styles.orderNowGradient}
              >
                <Text style={styles.orderNowText}>Order ngay đi bestieee ✨</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order, index) => {
            const status = getStatusDisplay(order.status);
            return (
              <TouchableOpacity 
                key={order._id || index} 
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderSuccess', { orderId: order.orderId })}
                activeOpacity={0.9}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.orderIdentity}>
                    <View style={styles.orderIconBox}>
                      <Image 
                        source={{ uri: order.items[0]?.image || 'https://images.unsplash.com/photo-1544787210-2213d84ad960?q=80&w=200&auto=format&fit=crop' }} 
                        style={styles.orderItemImage} 
                      />
                    </View>
                    <View>
                      <Text style={styles.orderIdText}>#{order.orderId.toUpperCase()}</Text>
                      <Text style={styles.orderTimeText}>
                        {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <status.Icon size={12} color={status.text} />
                    <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={styles.dottedDivider} />

                <View style={styles.cardBody}>
                  <View style={styles.itemsRow}>
                    <View style={styles.itemIconStack}>
                      {order.items.slice(0, 3).map((item: any, i: number) => (
                        <View key={i} style={[styles.miniItemIcon, { left: i * 15, zIndex: 3 - i }]}>
                          <Image 
                            source={{ uri: item.image || 'https://images.unsplash.com/photo-1544787210-2213d84ad960?q=80&w=200&auto=format&fit=crop' }} 
                            style={styles.miniImage} 
                          />
                        </View>
                      ))}
                    </View>
                    <Text style={styles.itemsSummary}>
                      {order.items.length} món • {order.items[0]?.name || 'Drink'}...
                    </Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Tổng tiền</Text>
                    <Text style={styles.priceValue}>{order.total.toLocaleString('vi-VN')}đ</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.tableTag}>
                    <MapPin size={12} color={Colors.ink} opacity={0.4} />
                    <Text style={styles.tableTagText}>Bàn {order.tableCode || 'Giao đi'}</Text>
                  </View>
                  
                  {order.status === 'completed' && !order.isReviewed && !ratedOrders.has(order.orderId) ? (
                    <TouchableOpacity 
                      style={styles.reviewBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedOrderId(order.orderId);
                        setReviewModalVisible(true);
                      }}
                    >
                      <Text style={styles.reviewBtnText}>Đánh giá <Star size={12} color="#fff" fill="#fff" /></Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.detailLink}>
                      <Text style={styles.detailLinkText}>Xem tracking</Text>
                      <ChevronRight size={16} color={Colors.hot} />
                    </View>
                  )}
                </View>

                {order.status === 'completed' && (
                  <View style={[styles.ratingSticker, { backgroundColor: (order.isReviewed || ratedOrders.has(order.orderId)) ? Colors.ink : Colors.mint }]}>
                    <Star size={10} color={(order.isReviewed || ratedOrders.has(order.orderId)) ? '#fff' : Colors.ink} fill={(order.isReviewed || ratedOrders.has(order.orderId)) ? '#fff' : "transparent"} />
                    <Text style={[styles.ratingText, { color: (order.isReviewed || ratedOrders.has(order.orderId)) ? '#fff' : Colors.ink }]}>
                      {(order.isReviewed || ratedOrders.has(order.orderId)) ? 'ĐÃ ĐÁNH GIÁ' : 'CHƯA ĐÁNH GIÁ'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomNav activeTab="orders" navigation={navigation} />

      {/* Review Modal */}
      <Modal visible={reviewModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%' }}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Đánh giá đơn hàng</Text>
                <Text style={styles.modalSub}>Bạn cho quán xin vài sao để nâng cấp dịch vụ nha</Text>
                
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                      <Star size={40} color={rating >= star ? Colors.hot : '#ccc'} fill={rating >= star ? Colors.hot : 'transparent'} />
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.reviewInput}
                  placeholder="Góp ý cho quán tại đây nha bạn..."
                  multiline
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  onSubmitEditing={Keyboard.dismiss}
                  blurOnSubmit={true}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setReviewModalVisible(false)}>
                    <Text style={styles.cancelText}>Thôi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.submitBtn, rating === 0 && { opacity: 0.5 }]} 
                    onPress={handleSubmitReview}
                    disabled={rating === 0}
                  >
                    <Text style={styles.submitText}>Gửi đánh giá</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.paper,
  },
  headerGradient: {
    paddingBottom: 25,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.display900,
    fontSize: 22,
    color: '#fff',
  },
  headerSubtitle: {
    fontFamily: Fonts.body600,
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  headerIconContainer: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 25,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontFamily: Fonts.display800,
    fontSize: 18,
    color: Colors.ink,
    marginBottom: 8,
  },
  emptySubText: {
    fontFamily: Fonts.body600,
    fontSize: 14,
    color: Colors.ink,
    opacity: 0.4,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  orderNowBtn: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  orderNowGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  orderNowText: {
    fontFamily: Fonts.display800,
    fontSize: 16,
    color: '#fff',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.ink,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  orderIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.paper,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.ink,
    overflow: 'hidden',
  },
  orderItemImage: {
    width: '100%',
    height: '100%',
  },
  orderIdText: {
    fontFamily: Fonts.display900,
    fontSize: 15,
    color: Colors.ink,
    marginBottom: 2,
  },
  orderTimeText: {
    fontFamily: Fonts.body600,
    fontSize: 11,
    color: Colors.ink,
    opacity: 0.4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.ink,
  },
  statusText: {
    fontFamily: Fonts.display900,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dottedDivider: {
    height: 2,
    borderWidth: 1,
    borderColor: Colors.ink,
    borderStyle: 'dashed',
    opacity: 0.1,
    marginBottom: 15,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  itemsRow: {
    flex: 1,
  },
  itemIconStack: {
    flexDirection: 'row',
    height: 25,
    marginBottom: 8,
  },
  miniItemIcon: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  miniImage: {
    width: '100%',
    height: '100%',
  },
  itemsSummary: {
    fontFamily: Fonts.body700,
    fontSize: 13,
    color: Colors.ink,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontFamily: Fonts.body600,
    fontSize: 10,
    color: Colors.ink,
    opacity: 0.4,
    marginBottom: 2,
  },
  priceValue: {
    fontFamily: Fonts.display900,
    fontSize: 18,
    color: Colors.ink,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.paper,
    padding: 12,
    borderRadius: 18,
  },
  tableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tableTagText: {
    fontFamily: Fonts.body700,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.6,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLinkText: {
    fontFamily: Fonts.display800,
    fontSize: 12,
    color: Colors.hot,
  },
  ratingSticker: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: Colors.hot,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    gap: 4,
    transform: [{ rotate: '5deg' }],
  },
  ratingText: {
    fontFamily: Fonts.display900,
    fontSize: 8,
    color: '#fff',
  },
  reviewBtn: {
    backgroundColor: Colors.hot,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewBtnText: {
    fontFamily: Fonts.display800,
    fontSize: 12,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 30,
    paddingBottom: 50,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: Colors.ink,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalTitle: {
    fontFamily: Fonts.display900,
    fontSize: 26,
    color: Colors.ink,
    textAlign: 'center',
  },
  modalSub: {
    fontFamily: Fonts.body700,
    fontSize: 15,
    color: Colors.ink,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 30,
  },
  reviewInput: {
    backgroundColor: Colors.paper,
    borderRadius: 20,
    padding: 20,
    height: 120,
    fontFamily: Fonts.body600,
    fontSize: 15,
    color: Colors.ink,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: Colors.ink,
    marginBottom: 25,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelBtn: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.paper,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  cancelText: {
    fontFamily: Fonts.display800,
    fontSize: 16,
    color: Colors.ink,
  },
  submitBtn: {
    flex: 2,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.hot,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
    shadowColor: Colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  submitText: {
    fontFamily: Fonts.display800,
    fontSize: 16,
    color: '#fff',
  },
});
