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
  Alert,
  Dimensions,
} from 'react-native';
import { 
  ChevronLeft, 
  Sparkles, 
  Ticket, 
  Gift, 
  ArrowRight,
  Info
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../theme';
import { clientApi, authApi } from '../api/client';

const { width } = Dimensions.get('window');

export default function LoyaltyStoreScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const profile = await authApi.getMe();
      setUserData(profile);

      const res = await clientApi.getVouchers(profile?.phone);
      // Filter only loyalty vouchers (pointCost > 0)
      const loyaltyItems = (res.items || []).filter((v: any) => (v.pointCost || 0) > 0);
      setVouchers(loyaltyItems);
    } catch (error) {
      console.error('Fetch loyalty store failed:', error);
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

  const handleRedeem = async (voucher: any) => {
    if (voucher.isRedeemed) {
      Alert.alert('Hì hì', 'Bạn đã đổi voucher này rồi nha! Vào kho voucher để dùng thui!');
      return;
    }

    if (!voucher.isAffordable) {
      Alert.alert('Opps!', 'Bạn chưa đủ điểm nè. Đi uống thêm trà sữa để tích điểm nha! 🧋');
      return;
    }

    Alert.alert(
      'Xác nhận đổi quà',
      `Dùng ${voucher.pointCost.toLocaleString()} điểm để đổi lấy voucher "${voucher.title}" nhé?`,
      [
        { text: 'Suy nghĩ lại', style: 'cancel' },
        {
          text: 'Đổi luôn!',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await clientApi.redeemVoucher(userData.phone, voucher.code);
              // Cập nhật điểm ngay tắp lự để sếp thấy nó nhảy số luôn!
              if (res.currentPoints !== undefined) {
                setUserData({ ...userData, loyaltyPoints: res.currentPoints });
              }
              Alert.alert('Thành công!', `${res.message}\nSố điểm còn lại: ${res.currentPoints.toLocaleString()} điểm`);
              fetchData();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể đổi quà lúc này');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={Colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đổi quà</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Points Display */}
        <View style={styles.pointsCard}>
          <LinearGradient
            colors={[Colors.lavn, Colors.lavn2]}
            style={styles.pointsGradient}
          >
            <View style={styles.pointsRow}>
              <View>
                <Text style={styles.pointsLabel}>Số điểm hiện có</Text>
                <View style={styles.pointsValueRow}>
                  <Gift size={24} color={Colors.ink} />
                  <Text style={styles.pointsValue}>{userData?.loyaltyPoints?.toLocaleString() || 0}</Text>
                </View>
              </View>
              <View style={styles.pointsIconContainer}>
                <Gift size={40} color="#fff" opacity={0.5} />
              </View>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>VOUCHER ĐỘC QUYỀN</Text>

        {vouchers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ticket size={48} color={Colors.ink} opacity={0.2} />
            <Text style={styles.emptyText}>Hiện chưa có voucher nào để đổi bằng điểm nha!</Text>
          </View>
        ) : (
          vouchers.map((item) => (
            <TouchableOpacity 
              key={item.code} 
              style={[
                styles.voucherCard,
                item.isRedeemed && styles.redeemedCard
              ]}
              onPress={() => handleRedeem(item)}
              disabled={loading}
            >
              <View style={styles.voucherLeft}>
                <View style={[
                  styles.iconBox,
                  { backgroundColor: item.isRedeemed ? '#eee' : Colors.mint }
                ]}>
                  <Ticket size={24} color={Colors.ink} />
                </View>
              </View>

              <View style={styles.voucherMain}>
                <Text style={styles.voucherTitle}>{item.title}</Text>
                <Text style={styles.voucherSub}>{item.description}</Text>
                <View style={styles.costBadge}>
                  <Ticket size={12} color={item.isRedeemed ? '#888' : Colors.hot} />
                  <Text style={[
                    styles.costText,
                    { color: item.isRedeemed ? '#888' : Colors.ink }
                  ]}>
                    {item.pointCost.toLocaleString()} điểm
                  </Text>
                </View>
              </View>

              <View style={styles.voucherAction}>
                {item.isRedeemed ? (
                  <View style={styles.claimedBadge}>
                    <Text style={styles.claimedText}>Đã đổi</Text>
                  </View>
                ) : (
                  <View style={[
                    styles.redeemIcon,
                    !item.isAffordable && styles.disabledRedeem
                  ]}>
                    <ArrowRight size={20} color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.infoBox}>
          <Info size={16} color={Colors.ink} opacity={0.5} />
          <Text style={styles.infoText}>
            Dùng điểm để đổi voucher. Sau khi đổi, voucher sẽ tự động xuất hiện trong "Kho Voucher của tôi".
          </Text>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  safeArea: {
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 15,
    backgroundColor: Colors.paper,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  headerTitle: {
    fontFamily: Fonts.display900,
    fontSize: 20,
    color: Colors.ink,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pointsCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.ink,
    shadowColor: Colors.ink,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 30,
  },
  pointsGradient: {
    padding: 24,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabel: {
    fontFamily: Fonts.display800,
    fontSize: 14,
    color: Colors.ink,
    opacity: 0.6,
    marginBottom: 4,
  },
  pointsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsValue: {
    fontFamily: Fonts.display900,
    fontSize: 32,
    color: Colors.ink,
  },
  pointsIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: Fonts.display900,
    fontSize: 14,
    color: Colors.ink,
    opacity: 0.4,
    marginBottom: 20,
    letterSpacing: 1,
  },
  voucherCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.ink,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  redeemedCard: {
    opacity: 0.7,
    backgroundColor: '#f8f8f8',
    borderColor: '#ddd',
  },
  voucherLeft: {
    marginRight: 15,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  voucherMain: {
    flex: 1,
  },
  voucherTitle: {
    fontFamily: Fonts.display800,
    fontSize: 16,
    color: Colors.ink,
    marginBottom: 2,
  },
  voucherSub: {
    fontFamily: Fonts.body500,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.5,
    marginBottom: 8,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    alignSelf: 'flex-start',
    gap: 4,
  },
  costText: {
    fontFamily: Fonts.display800,
    fontSize: 11,
  },
  voucherAction: {
    marginLeft: 10,
  },
  redeemIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.hot,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  disabledRedeem: {
    backgroundColor: '#ddd',
  },
  claimedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#eee',
    borderWidth: 1.5,
    borderColor: '#ccc',
  },
  claimedText: {
    fontFamily: Fonts.display800,
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 15,
  },
  emptyText: {
    fontFamily: Fonts.body600,
    fontSize: 14,
    color: Colors.ink,
    opacity: 0.4,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 15,
    borderRadius: 18,
    marginTop: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: Fonts.body500,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.6,
    lineHeight: 18,
  },
});
