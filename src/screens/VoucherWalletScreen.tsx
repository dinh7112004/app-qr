import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { 
  ChevronLeft, 
  Ticket, 
  Clock, 
  CheckCircle2, 
  Search,
  Sparkles,
  Tag,
  Info,
  QrCode
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../theme';
import { clientApi, authApi } from '../api/client';
import { s, vs, ms } from '../utils/responsive';

const { width } = Dimensions.get('window');

export default function VoucherWalletScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'used'>('available');
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const profile = await authApi.getMe().catch(() => null);
      setUserData(profile);

      if (profile && profile.phone) {
        const identifiers = [profile.phone, profile._id].filter(Boolean).join(',');
        const res = await clientApi.getVouchers(identifiers);
        const ownedVouchers = (res.items || []).filter((v: any) => v.isRedeemed);
        setVouchers(ownedVouchers);
      }
    } catch (error) {
      console.error('Fetch voucher wallet failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredVouchers = vouchers.filter(v => {
    const isExpired = v.expiryDate && new Date(v.expiryDate) < new Date();
    if (activeTab === 'available') {
      return !v.isUsed && !isExpired;
    }
    return v.isUsed || isExpired;
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.hot} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Decorative Background Circles */}
      <View style={[styles.bgCircle, { top: -50, right: -50, backgroundColor: Colors.lavn + '33' }]} />
      <View style={[styles.bgCircle, { bottom: -100, left: -50, backgroundColor: Colors.mint + '33' }]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={Colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Kho Voucher</Text>
            <View style={styles.titleUnderline} />
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <QrCode size={22} color={Colors.ink} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'available' && styles.activeTab]} 
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>Sẵn sàng dùng</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'used' && styles.activeTab]} 
            onPress={() => setActiveTab('used')}
          >
            <Text style={[styles.tabText, activeTab === 'used' && styles.activeTabText]}>Hết hiệu lực</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.introCard}>
          <Sparkles size={20} color={Colors.hot} />
          <Text style={styles.introText}>
            {activeTab === 'available' 
              ? `Bestie đang có ${filteredVouchers.length} ưu đãi xịn xò chờ check-in nè!` 
              : 'Nơi lưu giữ những kỷ niệm "săn deal" thần thánh của bạn.'}
          </Text>
        </View>

        {filteredVouchers.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyGraphicContainer}>
              <LinearGradient
                colors={[Colors.lavn + '44', Colors.mint + '44']}
                style={styles.emptyGraphicCircle}
              >
                <Ticket size={80} color={Colors.hot} style={{ transform: [{ rotate: '-15deg' }] }} />
                <View style={styles.emptyGraphicOverlay}>
                  <Sparkles size={40} color={Colors.mint} />
                </View>
              </LinearGradient>
              <View style={[styles.miniIcon, { top: 0, right: 0, backgroundColor: Colors.peach }]}>
                <Tag size={16} color={Colors.ink} />
              </View>
              <View style={[styles.miniIcon, { bottom: 10, left: -10, backgroundColor: Colors.lavn }]}>
                <Clock size={16} color={Colors.ink} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'available' ? 'Bestie ơi, ví đang trống...' : 'Chưa có voucher nào quá hạn!'}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'available' 
                ? 'Ghé Tiệm Đổi Quà để rinh thêm voucher bằng điểm tích lũy nha!' 
                : 'Đừng để voucher nào "ngủ quên" đến mức hết hạn nhé!'}
            </Text>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => navigation.navigate('LoyaltyStore')}
            >
              <LinearGradient colors={[Colors.ink, '#444']} style={styles.actionGradient}>
                <Text style={styles.actionBtnText}>Đi đổi voucher ngay ➔</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          filteredVouchers.map((item, idx) => (
            <VoucherTicket 
              key={item.code || idx} 
              item={item} 
              isExpired={activeTab === 'used'} 
              onPress={() => activeTab === 'available' && navigation.navigate('Menu')}
            />
          ))
        )}

        <View style={styles.footerInfo}>
          <Info size={14} color={Colors.ink} opacity={0.4} />
          <Text style={styles.footerText}>Nhấn vào voucher để sử dụng khi thanh toán tại quầy nha!</Text>
        </View>
        
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const VoucherTicket = ({ item, isExpired, onPress }: any) => {
  const isActuallyExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
  const isUsedOrExpired = isExpired || item.isUsed || isActuallyExpired;

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      style={[styles.ticketContainer, isUsedOrExpired && styles.ticketDisabled]}
      onPress={onPress}
    >
      {/* Left Part - The Value */}
      <View style={[styles.ticketLeft, { backgroundColor: isUsedOrExpired ? '#E0E0E0' : Colors.hot }]}>
        <View style={styles.ticketValueContainer}>
          <Text style={styles.ticketCurrency}>{item.type === 'percent' ? '' : 'đ'}</Text>
          <Text style={styles.ticketValue}>
            {item.type === 'percent' ? item.value : (item.value / 1000)}
          </Text>
          <Text style={styles.ticketUnit}>{item.type === 'percent' ? '%' : 'k'}</Text>
        </View>
        <View style={styles.ticketTypeBadge}>
          <Text style={styles.ticketTypeText}>VOUCHER</Text>
        </View>
        
        {/* Ticket Holes for the left part */}
        <View style={styles.holeLeftTop} />
        <View style={styles.holeLeftBottom} />
      </View>

      {/* Right Part - Details */}
      <View style={styles.ticketRight}>
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketTitle} numberOfLines={1}>{item.title}</Text>
          <Tag size={16} color={isUsedOrExpired ? '#999' : Colors.ink} opacity={0.3} />
        </View>
        
        <Text style={styles.ticketDesc} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.ticketFooter}>
          <View style={styles.expiryBox}>
            <Clock size={12} color={isUsedOrExpired ? '#999' : Colors.hot} />
            <Text style={[styles.expiryDateText, isUsedOrExpired && styles.textMuted]}>
              HSD: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('vi-VN') : 'Vô hạn'}
            </Text>
          </View>
          
          {item.isUsed ? (
            <View style={styles.statusBadgeUsed}>
              <CheckCircle2 size={12} color="#27AE60" />
              <Text style={styles.statusTextUsed}>Đã dùng</Text>
            </View>
          ) : isActuallyExpired ? (
            <View style={styles.statusBadgeExpired}>
              <Text style={styles.statusTextExpired}>Hết hạn</Text>
            </View>
          ) : (
            <View style={styles.useNowBtn}>
              <Text style={styles.useNowText}>DÙNG NGAY</Text>
            </View>
          )}
        </View>

        {/* Ticket Holes for the right part */}
        <View style={styles.holeRightTop} />
        <View style={styles.holeRightBottom} />
      </View>

      {/* Vertical Perforation Line */}
      <View style={styles.perforationLine} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    zIndex: 0,
  },
  safeArea: {
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.display900,
    fontSize: 22,
    color: Colors.ink,
  },
  titleUnderline: {
    width: 40,
    height: 4,
    backgroundColor: Colors.hot,
    borderRadius: 2,
    marginTop: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabWrapper: {
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 18,
    padding: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  tabText: {
    fontFamily: Fonts.display800,
    fontSize: 14,
    color: '#999',
  },
  activeTabText: {
    color: Colors.ink,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  introText: {
    flex: 1,
    fontFamily: Fonts.body700,
    fontSize: 13,
    color: Colors.ink,
    opacity: 0.7,
  },
  ticketContainer: {
    flexDirection: 'row',
    height: 140,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.ink,
    shadowColor: Colors.ink,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
  },
  ticketDisabled: {
    borderColor: '#ddd',
    shadowOpacity: 0,
  },
  ticketLeft: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ticketValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ticketCurrency: {
    fontFamily: Fonts.display900,
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
  },
  ticketValue: {
    fontFamily: Fonts.display900,
    fontSize: 38,
    color: '#fff',
  },
  ticketUnit: {
    fontFamily: Fonts.display900,
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
  },
  ticketTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 5,
  },
  ticketTypeText: {
    fontFamily: Fonts.display900,
    fontSize: 10,
    color: '#fff',
    letterSpacing: 0.5,
  },
  ticketRight: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    position: 'relative',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTitle: {
    flex: 1,
    fontFamily: Fonts.display900,
    fontSize: 17,
    color: Colors.ink,
  },
  ticketDesc: {
    fontFamily: Fonts.body600,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.5,
    marginTop: 5,
    lineHeight: 18,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  expiryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expiryDateText: {
    fontFamily: Fonts.display800,
    fontSize: 11,
    color: Colors.ink,
  },
  statusBadgeUsed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextUsed: {
    fontFamily: Fonts.display900,
    fontSize: 10,
    color: '#2E7D32',
  },
  statusBadgeExpired: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextExpired: {
    fontFamily: Fonts.display900,
    fontSize: 10,
    color: '#999',
  },
  useNowBtn: {
    backgroundColor: Colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  useNowText: {
    fontFamily: Fonts.display900,
    fontSize: 10,
    color: '#fff',
  },
  perforationLine: {
    position: 'absolute',
    left: 100,
    top: 15,
    bottom: 15,
    width: 0,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
    zIndex: 5,
  },
  // Holes for ticket effect
  holeLeftTop: { position: 'absolute', top: -10, right: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.paper, borderWidth: 2, borderColor: Colors.ink },
  holeLeftBottom: { position: 'absolute', bottom: -10, right: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.paper, borderWidth: 2, borderColor: Colors.ink },
  holeRightTop: { position: 'absolute', top: -10, left: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.paper, borderWidth: 2, borderColor: Colors.ink },
  holeRightBottom: { position: 'absolute', bottom: -10, left: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.paper, borderWidth: 2, borderColor: Colors.ink },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyGraphicContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  emptyGraphicCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptyGraphicOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  miniIcon: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyTitle: {
    fontFamily: Fonts.display900,
    fontSize: 22,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySub: {
    fontFamily: Fonts.body600,
    fontSize: 14,
    color: Colors.ink,
    opacity: 0.4,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  actionBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  actionGradient: {
    paddingHorizontal: 35,
    paddingVertical: 18,
  },
  actionBtnText: {
    fontFamily: Fonts.display900,
    fontSize: 16,
    color: '#fff',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  footerText: {
    fontFamily: Fonts.body600,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.4,
  },
  textMuted: {
    color: '#999',
  },
});
