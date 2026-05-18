import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Animated,
  ScrollView,
  Image,
  Clipboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, ShoppingBag, ArrowRight, Sparkles, Bot, ArrowLeft, Copy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../theme';
import { clientApi } from '../api/client';
import { useCart } from '../context/CartContext';
import { s, vs, ms, SCREEN_WIDTH } from '../utils/responsive';

const { width } = Dimensions.get('window');

export default function OrderSuccessScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { orderId, total, tableCode, qrCode } = route.params || {};
  const { session } = useCart();
  console.log('OrderSuccess Params:', { orderId, total, tableCode });

  const handleContinue = () => {
    navigation.navigate('Menu', { 
      storeId: session.storeId || 'store-genz-01', 
      tableCode: session.tableCode || tableCode || 'A12' 
    });
  };
  
  const { width, height } = Dimensions.get('window');
  const isSmallDevice = width < 380;
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const [status, setStatus] = React.useState('pending');
  const [loading, setLoading] = React.useState(true);
  const [orderData, setOrderData] = React.useState<any>(null);

  const fetchStatus = async () => {
    try {
      if (!orderId) return;
      const [trackingRes, detailsRes] = await Promise.all([
        clientApi.getOrderTracking(orderId),
        clientApi.getOrderDetails(orderId)
      ]);
      
      if (trackingRes && trackingRes.status) {
        setStatus(trackingRes.status);
      }
      if (detailsRes) {
        setOrderData(detailsRes);
      }
    } catch (error) {
      console.error('Fetch status/details failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const getStatusDisplay = (s: string) => {
    switch (s) {
      case 'pending': return { title: 'Đã gửi đơn', sub: 'Quán đang xem đơn của bạn nha', color: Colors.hot };
      case 'confirmed': return { title: 'Đã nhận đơn', sub: 'Bắt đầu chuẩn bị món cho bạn rồi nè', color: Colors.mint };
      case 'preparing': return { title: 'Đang pha chế', sub: 'Chờ xíu món ngon sắp tới liền', color: Colors.lavn };
      case 'ready': return { title: 'Xong rồi nè', sub: 'Món đã sẵn sàng, mời bạn nhận nha', color: Colors.peach };
      case 'completed': return { title: 'Hoàn tất', sub: 'Chúc bạn ngon miệng nhé', color: Colors.ink };
      default: return { title: 'Chốt đơn thành công', sub: s, color: Colors.hot };
    }
  };

  const statusInfo = getStatusDisplay(status);

  if (loading || !orderData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.paper }}>
        <Text style={{ fontFamily: Fonts.body700, fontSize: 16, color: Colors.ink }}>Đang tải thông tin đơn hàng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={[Colors.mint, Colors.lavn, Colors.hot]} 
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.topHeader}>
          <TouchableOpacity 
            style={styles.backCircle}
            onPress={() => navigation.navigate('Menu')}
          >
            <ArrowLeft size={24} color={Colors.ink} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            isSmallDevice && { paddingVertical: 10 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {orderData?.paymentMethod !== 'cash' && status === 'pending_payment' ? (
              // MÀN THANH TOÁN (Chờ thanh toán)
              <View style={[
                styles.successCard,
                isSmallDevice && { padding: 20, borderRadius: 30 },
                { alignItems: 'center' }
              ]}>
                <Text style={[styles.paymentTitle, { fontSize: 20, marginBottom: 10, color: Colors.ink }]}>Thanh toán chuyển khoản</Text>
                <Text style={[styles.paymentSub, { textAlign: 'center', marginBottom: 20, color: Colors.ink, opacity: 0.6 }]}>Quét mã QR để thanh toán cho đơn hàng này</Text>
                
                <View style={[styles.qrWrapper, { marginBottom: 20, alignSelf: 'center' }]}>
                  <Image 
                    source={{ uri: qrCode ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}` : `https://img.vietqr.io/image/mb-0711200459999-compact2.png?amount=${orderData?.total || total || 0}&addInfo=${orderId}&accountName=PHUNG QUANG DINH` }} 
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={[styles.bankInfo, { marginBottom: 20 }]}>
                  <View style={styles.bankInfoRow}>
                    <Text style={styles.bankInfoLabel}>Ngân hàng</Text>
                    <Text style={styles.bankInfoValue}>MB Bank</Text>
                  </View>
                  
                  <View style={styles.bankInfoRow}>
                    <Text style={styles.bankInfoLabel}>Số tài khoản</Text>
                    <View style={styles.valueContainer}>
                      <Text style={styles.bankInfoValue}>0711200459999</Text>
                      <TouchableOpacity onPress={() => Clipboard.setString('0711200459999')} style={styles.copyBtn}>
                        <Copy size={12} color={Colors.hot} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.bankInfoRow}>
                    <Text style={styles.bankInfoLabel}>Chủ tài khoản</Text>
                    <Text style={styles.bankInfoValue}>PHUNG QUANG DINH</Text>
                  </View>

                  <View style={styles.bankInfoRow}>
                    <Text style={styles.bankInfoLabel}>Số tiền</Text>
                    <View style={styles.valueContainer}>
                      <Text style={[styles.bankInfoValue, { color: Colors.hot, fontWeight: 'bold' }]}>{(orderData?.total || total || 0).toLocaleString('vi-VN')}đ</Text>
                      <TouchableOpacity onPress={() => Clipboard.setString((orderData?.total || total || 0).toString())} style={styles.copyBtn}>
                        <Copy size={12} color={Colors.hot} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.bankInfoRow}>
                    <Text style={styles.bankInfoLabel}>Nội dung</Text>
                    <View style={styles.valueContainer}>
                      <Text style={styles.bankInfoValue}>{orderId}</Text>
                      <TouchableOpacity onPress={() => Clipboard.setString(orderId)} style={styles.copyBtn}>
                        <Copy size={12} color={Colors.hot} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={{ fontFamily: Fonts.body600, fontSize: 14, color: Colors.ink, opacity: 0.5, textAlign: 'center' }}>
                  Hệ thống sẽ tự động chuyển màn hình khi nhận được tiền...
                </Text>
              </View>
            ) : (
              // MÀN TRẠNG THÁI ĐƠN HÀNG (Đã thanh toán hoặc Tiền mặt)
              <View style={[
                styles.successCard,
                isSmallDevice && { padding: 20, borderRadius: 30 }
              ]}>
                <View style={[styles.iconContainer, isSmallDevice && { marginBottom: 10 }]}>
                  <CheckCircle2 size={isSmallDevice ? 60 : 80} color={statusInfo.color} />
                </View>

                <Text style={[
                  styles.title, 
                  { color: statusInfo.color },
                  isSmallDevice && { fontSize: 22 }
                ]}>{statusInfo.title}</Text>
                <Text style={[
                  styles.subtitle,
                  isSmallDevice && { fontSize: 14, marginTop: 5 }
                ]}>{statusInfo.sub}</Text>

                <View style={[styles.divider, isSmallDevice && { marginVertical: 15 }]} />

                <View style={[styles.infoRow, isSmallDevice && { marginBottom: 15 }]}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Mã đơn</Text>
                    <Text style={[styles.infoValue, isSmallDevice && { fontSize: 13 }]}>
                      #{orderId?.toUpperCase() || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Số bàn</Text>
                    <Text style={[styles.infoValue, isSmallDevice && { fontSize: 15 }]}>
                      {orderData?.tableCode || tableCode || '...'}
                    </Text>
                  </View>
                </View>

                <View style={styles.receiptContainer}>
                  <Text style={styles.receiptTitle}>Chi tiết đơn hàng</Text>
                  
                  {orderData?.items?.map((item: any, idx: number) => (
                    <View key={idx} style={styles.receiptItem}>
                      <View style={styles.itemQtyName}>
                        <Text style={styles.itemQtyText}>{item.quantity}x</Text>
                        <View>
                          <Text style={styles.itemNameText}>{item.name}</Text>
                          {item.size && <Text style={styles.itemOptionText}>Size: {item.size === 'v' ? 'Vừa' : item.size === 'x' ? 'XXL' : 'Mini'}</Text>}
                          {item.toppings?.length > 0 && <Text style={styles.itemOptionText}>+{item.toppings.join(', ')}</Text>}
                        </View>
                      </View>
                      <Text style={styles.itemPriceText}>{item.lineTotal?.toLocaleString('vi-VN')}đ</Text>
                    </View>
                  ))}

                  <View style={styles.receiptDivider} />

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Tạm tính</Text>
                    <Text style={styles.priceValue}>{orderData?.subtotal?.toLocaleString('vi-VN') || '0'}đ</Text>
                  </View>

                  {orderData?.discount > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceLabel, { color: Colors.hot }]}>Giảm giá</Text>
                      <Text style={[styles.priceValue, { color: Colors.hot }]}>-{orderData.discount.toLocaleString('vi-VN')}đ</Text>
                    </View>
                  )}

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Phí dịch vụ (5%)</Text>
                    <Text style={styles.priceValue}>{orderData?.serviceFee?.toLocaleString('vi-VN') || '0'}đ</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={[styles.actionArea, isSmallDevice && { marginTop: 30, gap: 10 }]}>
              <TouchableOpacity 
                style={styles.trackBtn}
                onPress={() => navigation.navigate('Menu')}
              >
                <LinearGradient
                  colors={[Colors.ink, '#2D2D2D']}
                  style={[styles.btnGradient, isSmallDevice && { paddingVertical: 15 }]}
                >
                  <ShoppingBag size={20} color="#fff" />
                  <Text style={[styles.btnText, isSmallDevice && { fontSize: 16 }]}>Tiếp tục đặt món</Text>
                  <ArrowRight size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: vs(20), // Responsive padding
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    alignItems: 'center',
    paddingBottom: vs(20),
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  successCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.ink,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  title: {
    fontFamily: Fonts.display800,
    fontSize: 26,
    color: Colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.body600,
    fontSize: 16,
    color: Colors.ink,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 10,
  },
  divider: {
    width: '100%',
    height: 2,
    backgroundColor: Colors.ink,
    opacity: 0.05,
    marginVertical: 25,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  infoRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: Fonts.body700,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.4,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  infoValue: {
    fontFamily: Fonts.display800,
    fontSize: 18,
    color: Colors.ink,
  },
  totalContainer: {
    width: '100%',
    backgroundColor: Colors.paper,
    borderRadius: 25,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
    borderStyle: 'dashed',
  },
  totalLabel: {
    fontFamily: Fonts.display700,
    fontSize: 14,
    color: Colors.ink,
  },
  totalValueText: {
    fontFamily: Fonts.display900,
    fontSize: 24,
    color: Colors.hot,
  },
  receiptContainer: {
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: Colors.paper,
    borderStyle: 'dashed',
  },
  receiptTitle: {
    fontFamily: Fonts.display800,
    fontSize: 16,
    color: Colors.ink,
    marginBottom: 15,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemQtyName: {
    flexDirection: 'row',
    flex: 1,
    gap: 10,
  },
  itemQtyText: {
    fontFamily: Fonts.display800,
    fontSize: 14,
    color: Colors.ink,
    opacity: 0.6,
  },
  itemNameText: {
    fontFamily: Fonts.body700,
    fontSize: 14,
    color: Colors.ink,
  },
  itemOptionText: {
    fontFamily: Fonts.body600,
    fontSize: 11,
    color: Colors.ink,
    opacity: 0.4,
    marginTop: 2,
  },
  itemPriceText: {
    fontFamily: Fonts.display700,
    fontSize: 14,
    color: Colors.ink,
  },
  receiptDivider: {
    height: 2,
    backgroundColor: Colors.paper,
    marginVertical: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontFamily: Fonts.body700,
    fontSize: 13,
    color: Colors.ink,
    opacity: 0.6,
  },
  priceValue: {
    fontFamily: Fonts.display700,
    fontSize: 13,
    color: Colors.ink,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: Colors.paper,
  },
  botMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
    gap: 15,
  },
  botAvatar: {
    width: 60,
    height: 60,
    backgroundColor: Colors.lavn,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  bubble: {
    flex: 1,
    backgroundColor: Colors.ink,
    borderRadius: 20,
    padding: 15,
    borderBottomLeftRadius: 5,
  },
  bubbleText: {
    fontFamily: Fonts.body700,
    fontSize: 13,
    color: '#fff',
    lineHeight: 18,
  },
  actionArea: {
    width: '100%',
    marginTop: 50,
    gap: 15,
  },
  trackBtn: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  btnText: {
    fontFamily: Fonts.display800,
    fontSize: 18,
    color: '#fff',
  },
  backHomeBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backHomeText: {
    fontFamily: Fonts.body700,
    fontSize: 15,
    color: Colors.ink,
    opacity: 0.4,
  },
  paymentContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  paymentTitle: {
    fontFamily: Fonts.display800,
    fontSize: 16,
    color: Colors.ink,
    marginBottom: 5,
  },
  paymentSub: {
    fontFamily: Fonts.body600,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 15,
  },
  qrWrapper: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 15,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  bankInfo: {
    width: '100%',
    backgroundColor: Colors.paper,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.ink,
    borderStyle: 'dashed',
  },
  bankInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankInfoLabel: {
    fontFamily: Fonts.body600,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.6,
  },
  bankInfoValue: {
    fontFamily: Fonts.body700,
    fontSize: 12,
    color: Colors.ink,
    flexShrink: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    justifyContent: 'flex-end',
  },
  copyBtn: {
    backgroundColor: 'rgba(255,107,107,0.1)',
    padding: 4,
    borderRadius: 4,
  },
});
