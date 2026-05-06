import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  SafeAreaView,
  Platform,
  TextInput,
  Modal
} from 'react-native';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, Tag, ChevronRight, Search, Check, Banknote } from 'lucide-react-native';
import { Colors, Fonts } from '../theme';
import { useCart } from '../context/CartContext';
import { clientApi, authApi, STORE_ID, DEFAULT_TABLE } from '../api/client';
import StatusModal from '../components/StatusModal';


export default function CartScreen({ route, navigation }: any) {
  const { items, updateQuantity, removeItem, quote, clearCart, voucherCode, setVoucherCode } = useCart();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [inputPromo, setInputPromo] = useState('');
  const [tempPromo, setTempPromo] = useState(voucherCode || '');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [statusModal, setStatusModal] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
    visible: false,
    type: 'success',
    title: '',
    message: ''
  });
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const { storeId = STORE_ID, tableCode = DEFAULT_TABLE } = route.params || {};

  React.useEffect(() => {
    clientApi.getVouchers().then(data => setAvailableVouchers(data.items || [])).catch(() => {});
  }, []);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const profile = await authApi.getMe().catch(() => null);
      
      const res = await clientApi.createOrder({
        storeId: storeId,
        tableCode: tableCode,
        customerName: profile?.displayName || profile?.phone || 'Khách quý',
        customerPhone: profile?.phone || profile?._id,
        items: items.map(i => ({ 
          itemId: i.id, 
          quantity: i.quantity,
          toppings: i.itemData.selectedToppings || [],
          size: i.itemData.selectedSize || 'v'
        })),
        note: note || 'Không có ghi chú',
        voucherCode: voucherCode || undefined,
        paymentMethod: selectedPaymentMethod,
      });
      
      const confirmedOrder = res.order || res;

      clearCart();
      navigation.navigate('OrderSuccess', { 
        orderId: confirmedOrder.orderId, 
        total: confirmedOrder.total,
        tableCode: confirmedOrder.tableCode || tableCode
      });
    } catch (error) {
      console.error('Checkout failed:', error);
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Có lỗi rùi bạn ơi...',
        message: 'Không gửi được đơn hàng, bạn kiểm tra lại kết nối mạng nhé! 😢'
      });
    } finally {
      setLoading(false);
    }
  };


  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={Colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giỏ hàng trống trơn</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <ShoppingBag size={80} color={Colors.ink} opacity={0.1} />
          <Text style={[styles.itemName, { marginTop: 20, textAlign: 'center' }]}>Chưa có gì trong giỏ hết nèeee</Text>
          <TouchableOpacity 
            style={[styles.checkoutBtn, { width: '100%', marginTop: 30 }]} 
            onPress={() => navigation.navigate('Menu')}
          >
            <Text style={styles.checkoutText}>Đi kím món ngon liền ✨</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng của bestie</Text>
        <TouchableOpacity onPress={clearCart}>
          <Trash2 size={22} color={Colors.ink} opacity={0.3} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
        <View style={styles.tableInfoCard}>
          <Text style={styles.tableLabel}>BÀN {tableCode} • BOBA BABE</Text>
          <Text style={styles.tableStatus}>Bạn đang đặt món nè ✨</Text>
        </View>

        {items.map((item) => (
          <View key={item.cartKey} style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                  <View style={styles.optionBadge}>
                    <Text style={styles.optionBadgeText}>{item.itemData.selectedSize === 'x' ? 'XXL' : item.itemData.selectedSize === 'v' ? 'Vừa' : 'Mini'}</Text>
                  </View>
                  <View style={styles.optionBadge}>
                    <Text style={styles.optionBadgeText}>Đường: {item.itemData.selectedSweetness}</Text>
                  </View>
                  <View style={styles.optionBadge}>
                    <Text style={styles.optionBadgeText}>{item.itemData.selectedIce}</Text>
                  </View>
                </View>
                {item.itemData.toppingLabels?.length > 0 && (
                  <Text style={styles.toppingText}>+ {item.itemData.toppingLabels.join(', ')}</Text>
                )}
              </View>
              <View style={styles.itemFooter}>
                <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                <View style={styles.qtyContainer}>
                  <TouchableOpacity 
                    style={styles.qtyBtn} 
                    onPress={() => item.quantity === 1 ? removeItem(item.cartKey) : updateQuantity(item.cartKey, -1)}
                  >
                    {item.quantity === 1 ? <Trash2 size={14} color={Colors.hot} /> : <Minus size={16} color={Colors.ink} />}
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity 
                    style={[styles.qtyBtn, { backgroundColor: Colors.ink }]}
                    onPress={() => updateQuantity(item.cartKey, 1)}
                  >
                    <Plus size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.paymentSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.noteTitle}>Thông tin thanh toán</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(true)}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.paymentList}>
            <TouchableOpacity
              style={[styles.paymentOption, selectedPaymentMethod === 'cash' && styles.paymentOptionActive]}
              onPress={() => setSelectedPaymentMethod('cash')}
            >
              <View style={[styles.methodIcon, { backgroundColor: '#E8F5E9' }]}>
                <Banknote size={26} color="#2E7D32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodName}>Tiền mặt</Text>
                <Text style={styles.methodDesc}>Thanh toán khi nhận món</Text>
              </View>
              <View style={[styles.radio, selectedPaymentMethod === 'cash' && styles.radioActive]}>
                {selectedPaymentMethod === 'cash' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
            {selectedPaymentMethod !== 'cash' && (() => {
              const configs: Record<string, { name: string; desc: string; bg: string; renderIcon: () => React.ReactNode }> = {
                momo: { name: 'Ví MoMo', desc: 'Nhanh - Gọn - Không tiền lẻ', bg: '#A50064', renderIcon: () => <View style={{ alignItems: 'center' }}><Text style={{ fontFamily: Fonts.display900, fontSize: 9, color: '#fff', lineHeight: 10 }}>mo</Text><Text style={{ fontFamily: Fonts.display900, fontSize: 9, color: '#fff', lineHeight: 10 }}>mo</Text></View> },
                zalopay: { name: 'ZaloPay', desc: 'Liên kết tài khoản ngân hàng', bg: '#0068FF', renderIcon: () => <View style={{ alignItems: 'center' }}><Text style={{ fontFamily: Fonts.display900, fontSize: 7, color: '#fff', lineHeight: 9 }}>Zalo</Text><Text style={{ fontFamily: Fonts.display900, fontSize: 7, color: '#fff', lineHeight: 9 }}>Pay</Text></View> },
                vnpay: { name: 'VNPay / QR Bank', desc: 'Quét mã QR mọi ngân hàng', bg: '#005BAA', renderIcon: () => <View style={{ alignItems: 'center' }}><Text style={{ fontFamily: Fonts.display900, fontSize: 7.5, color: '#fff', lineHeight: 9 }}>VN</Text><Text style={{ fontFamily: Fonts.display900, fontSize: 7.5, color: '#E31837', lineHeight: 9 }}>PAY</Text></View> },
              };
              const cfg = configs[selectedPaymentMethod];
              if (!cfg) return null;
              return (
                <TouchableOpacity style={[styles.paymentOption, styles.paymentOptionActive]} onPress={() => setShowPaymentModal(true)}>
                  <View style={[styles.methodIcon, { backgroundColor: cfg.bg }]}>{cfg.renderIcon()}</View>
                  <View style={{ flex: 1 }}><Text style={styles.methodName}>{cfg.name}</Text><Text style={styles.methodDesc}>{cfg.desc}</Text></View>
                  <View style={[styles.radio, styles.radioActive]}><View style={styles.radioInner} /></View>
                </TouchableOpacity>
              );
            })()}
          </View>
        </View>

        <View style={styles.promoSection}>
          <Text style={styles.promoSectionTitle}>Áp dụng ưu đãi và giảm giá</Text>
          <TouchableOpacity 
            style={styles.promoTrigger}
            onPress={() => {
              setTempPromo(voucherCode || '');
              setShowPromoModal(true);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Tag size={20} color={Colors.hot} style={{ marginRight: 12 }} />
              <Text style={[styles.promoTriggerText, voucherCode ? { color: Colors.ink, fontFamily: Fonts.display800 } : {}]}>
                {voucherCode ? `Đã áp dụng: ${voucherCode}` : 'Áp dụng ưu đãi để được giảm...'}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.ink} opacity={0.3} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{quote?.subtotal?.toLocaleString('vi-VN') || '0'}đ</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí phục vụ</Text>
            <Text style={styles.summaryValue}>{quote?.serviceFee?.toLocaleString('vi-VN') || '0'}đ</Text>
          </View>
          {quote?.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.hot }]}>Khuyến mãi</Text>
              <Text style={[styles.summaryValue, { color: Colors.hot }]}>-{quote.discount.toLocaleString('vi-VN')}đ</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{quote?.total?.toLocaleString('vi-VN') || '0'}đ</Text>
          </View>
        </View>

        <View style={styles.noteContainer}>
          <Text style={styles.noteTitle}>Ghi chú cho quán nha...</Text>
          <TextInput 
            style={styles.noteInput}
            placeholder="Ví dụ: Đừng bỏ đá nhiều quá ạ..."
            placeholderTextColor="rgba(26,26,26,0.3)"
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkoutBtn, loading && { opacity: 0.7 }]}
          onPress={handleCheckout}
          disabled={loading}
        >
          <Text style={styles.checkoutText}>{loading ? 'Đang gửi vibe...' : 'Xác nhận đặt đơn ✨'}</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Method Bottom Sheet */}
      <Modal visible={showPaymentModal} animationType="slide" transparent onRequestClose={() => setShowPaymentModal(false)}>
        <TouchableOpacity style={styles.paymentModalOverlay} activeOpacity={1} onPress={() => setShowPaymentModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.paymentModalSheet}>
            <View style={styles.paymentModalHandle} />
            <Text style={styles.paymentModalTitle}>Phương thức thanh toán</Text>
            {[
              { id: 'cash', name: 'Tiền mặt', desc: 'Thanh toán khi nhận món', bg: '#E8F5E9', renderIcon: () => <Banknote size={22} color="#2E7D32" /> },
              { id: 'momo', name: 'Ví MoMo', desc: 'Nhanh - Gọn - Không tiền lẻ', bg: '#A50064', renderIcon: () => <View style={{ alignItems: 'center' }}><Text style={{ fontFamily: Fonts.display900, fontSize: 9, color: '#fff', lineHeight: 10 }}>mo</Text><Text style={{ fontFamily: Fonts.display900, fontSize: 9, color: '#fff', lineHeight: 10 }}>mo</Text></View> },
              { id: 'zalopay', name: 'ZaloPay', desc: 'Liên kết tài khoản ngân hàng', bg: '#0068FF', renderIcon: () => <View style={{ alignItems: 'center' }}><Text style={{ fontFamily: Fonts.display900, fontSize: 7, color: '#fff', lineHeight: 9 }}>Zalo</Text><Text style={{ fontFamily: Fonts.display900, fontSize: 7, color: '#fff', lineHeight: 9 }}>Pay</Text></View> },
              { id: 'vnpay', name: 'VNPay / QR Bank', desc: 'Quét mã QR mọi ngân hàng', bg: '#005BAA', renderIcon: () => <View style={{ alignItems: 'center' }}><Text style={{ fontFamily: Fonts.display900, fontSize: 7.5, color: '#fff', lineHeight: 9 }}>VN</Text><Text style={{ fontFamily: Fonts.display900, fontSize: 7.5, color: '#E31837', lineHeight: 9 }}>PAY</Text></View> },
            ].map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.paymentOption, selectedPaymentMethod === m.id && styles.paymentOptionActive, { marginBottom: 10 }]}
                onPress={() => { setSelectedPaymentMethod(m.id); setShowPaymentModal(false); }}
              >
                <View style={[styles.methodIcon, { backgroundColor: m.bg }]}>{m.renderIcon()}</View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodName}>{m.name}</Text>
                  <Text style={styles.methodDesc}>{m.desc}</Text>
                </View>
                <View style={[styles.radio, selectedPaymentMethod === m.id && styles.radioActive]}>
                  {selectedPaymentMethod === m.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showPromoModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPromoModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPromoModal(false)}>
              <ArrowLeft size={24} color={Colors.ink} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ưu đãi</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.promoSearchContainer}>
            <Search size={20} color={Colors.ink} opacity={0.4} />
            <TextInput 
              style={styles.promoSearchInput}
              placeholder="Nhập mã khuyến mãi hoặc quà..."
              placeholderTextColor="rgba(26,26,26,0.4)"
              value={inputPromo}
              onChangeText={setInputPromo}
              autoCapitalize="characters"
              onSubmitEditing={() => {
                setTempPromo(inputPromo);
              }}
            />
            {inputPromo.length > 0 && (
              <TouchableOpacity onPress={() => { setTempPromo(inputPromo); }}>
                <Text style={{ fontFamily: Fonts.display800, color: Colors.hot }}>Tìm/Chọn</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.promoList}>
            {availableVouchers.map(v => {
              const currentSubtotal = quote?.subtotal || 0;
              const isEligible = currentSubtotal >= (v.minOrderValue || 0);
              
              return (
                <TouchableOpacity 
                  key={v._id} 
                  style={[styles.promoCard, !isEligible && { opacity: 0.4 }]}
                  disabled={!isEligible}
                  onPress={() => {
                    setTempPromo(tempPromo === v.code ? '' : v.code);
                  }}
                >
                  <View style={[styles.promoIconContainer, !isEligible && { backgroundColor: '#999' }]}>
                    <Text style={styles.promoIconText}>Ưu đãi</Text>
                    <Text style={styles.promoIconSub}>Boba Babe</Text>
                  </View>
                  <View style={styles.promoInfo}>
                    <Text style={styles.promoCodeTitle}>{v.title}</Text>
                    <Text style={styles.promoDesc} numberOfLines={2}>
                      {v.description || `Giảm ${v.discountType === 'percentage' ? v.discountValue + '%' : v.discountValue.toLocaleString('vi-VN') + 'đ'} cho đơn hàng từ ${v.minOrderValue ? v.minOrderValue.toLocaleString('vi-VN') + 'đ' : '0đ'}`}
                    </Text>
                    {!isEligible && (
                      <Text style={{ fontFamily: Fonts.body600, fontSize: 11, color: Colors.hot, marginTop: 4 }}>
                        Mua thêm {(v.minOrderValue - currentSubtotal).toLocaleString('vi-VN')}đ để dùng mã này
                      </Text>
                    )}
                  </View>
                  <View style={[styles.checkbox, tempPromo === v.code && styles.checkboxActive]}>
                    {tempPromo === v.code && <Check size={16} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.checkoutBtn} 
              onPress={() => {
                setVoucherCode(tempPromo);
                setShowPromoModal(false);
              }}
            >
              <Text style={styles.checkoutText}>Áp dụng ưu đãi</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <StatusModal 
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.display800,
    fontSize: 18,
    color: Colors.ink,
  },
  itemList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tableInfoCard: {
    backgroundColor: Colors.lavn,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    padding: 18,
    marginBottom: 20,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
  },
  tableLabel: {
    fontFamily: Fonts.display800,
    fontSize: 10,
    color: Colors.ink,
    opacity: 0.6,
  },
  tableStatus: {
    fontFamily: Fonts.display800,
    fontSize: 16,
    color: Colors.ink,
    marginTop: 2,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    padding: 14,
    marginBottom: 15,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 0,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.ink,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  itemName: {
    fontFamily: Fonts.display800,
    fontSize: 15,
    color: Colors.ink,
  },
  itemOptions: {
    fontFamily: Fonts.body600,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.5,
    marginTop: 4,
  },
  optionBadge: {
    backgroundColor: 'rgba(255,107,107,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.2)',
  },
  optionBadgeText: {
    fontFamily: Fonts.display700,
    fontSize: 10,
    color: Colors.hot,
  },
  toppingText: {
    fontFamily: Fonts.body700,
    fontSize: 11,
    color: Colors.hot,
    marginTop: 6,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontFamily: Fonts.display800,
    fontSize: 16,
    color: Colors.hot,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mint,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1.5,
    borderColor: Colors.ink,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    marginHorizontal: 10,
    fontFamily: Fonts.display800,
    fontSize: 14,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    padding: 22,
    marginTop: 10,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontFamily: Fonts.body600,
    fontSize: 14,
    color: Colors.ink,
    opacity: 0.5,
  },
  summaryValue: {
    fontFamily: Fonts.display700,
    fontSize: 14,
    color: Colors.ink,
  },
  divider: {
    height: 2,
    backgroundColor: Colors.ink,
    opacity: 0.05,
    marginVertical: 12,
  },
  totalLabel: {
    fontFamily: Fonts.display800,
    fontSize: 18,
    color: Colors.ink,
  },
  totalValue: {
    fontFamily: Fonts.display800,
    fontSize: 22,
    color: Colors.ink,
  },
  promoSection: {
    marginTop: 10,
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 8,
    borderTopColor: 'rgba(26,26,26,0.03)',
  },
  promoSectionTitle: {
    fontFamily: Fonts.display800,
    fontSize: 18,
    color: Colors.ink,
    marginBottom: 15,
  },
  promoTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.1)',
  },
  promoTriggerText: {
    fontFamily: Fonts.body600,
    fontSize: 15,
    color: Colors.ink,
    opacity: 0.7,
  },
  noteContainer: {
    marginTop: 25,
    marginBottom: 120,
    paddingTop: 20,
    borderTopWidth: 8,
    borderTopColor: 'rgba(26,26,26,0.03)',
  },
  noteTitle: {
    fontFamily: Fonts.display800,
    fontSize: 16,
    color: Colors.ink,
    marginBottom: 10,
  },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    height: 90,
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.1)',
    fontFamily: Fonts.body500,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,26,26,0.05)',
  },
  checkoutBtn: {
    backgroundColor: Colors.ink,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  checkoutText: {
    color: '#fff',
    fontFamily: Fonts.display800,
    fontSize: 18,
  },
  paymentSection: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  paymentList: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 14,
    borderWidth: 2.5,
    borderColor: 'transparent',
    gap: 12,
  },
  paymentOptionActive: {
    borderColor: Colors.ink,
    backgroundColor: '#fff',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodName: {
    fontFamily: Fonts.display800,
    fontSize: 15,
    color: Colors.ink,
  },
  methodDesc: {
    fontFamily: Fonts.body600,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.4,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    opacity: 0.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    opacity: 1,
    backgroundColor: Colors.mint,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.ink,
  },
  seeAllText: {
    fontFamily: Fonts.display800,
    fontSize: 13,
    color: Colors.hot,
  },
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  paymentModalSheet: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  paymentModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(26,26,26,0.15)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  paymentModalTitle: {
    fontFamily: Fonts.display800,
    fontSize: 20,
    color: Colors.ink,
    marginBottom: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,26,26,0.05)',
  },
  modalTitle: {
    fontFamily: Fonts.display800,
    fontSize: 18,
    color: Colors.ink,
  },
  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,26,26,0.05)',
  },
  promoSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,26,26,0.04)',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
  },
  promoSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: Fonts.body500,
    fontSize: 14,
    color: Colors.ink,
  },
  promoList: {
    flex: 1,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26,26,26,0.05)',
  },
  promoIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#FF4757',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  promoIconText: {
    fontFamily: Fonts.display800,
    fontSize: 13,
    color: '#fff',
  },
  promoIconSub: {
    fontFamily: Fonts.body500,
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  promoInfo: {
    flex: 1,
    marginLeft: 15,
  },
  promoCodeTitle: {
    fontFamily: Fonts.display800,
    fontSize: 15,
    color: Colors.ink,
    marginBottom: 4,
  },
  promoDesc: {
    fontFamily: Fonts.body500,
    fontSize: 13,
    color: Colors.ink,
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(26,26,26,0.2)',
    marginLeft: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.hot,
    borderColor: Colors.hot,
  }
});
