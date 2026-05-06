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
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import { 
  User, 
  Settings, 
  ChevronRight, 
  SquareArrowRight, 
  Heart, 
  Star, 
  Award, 
  Camera, 
  AtSign,
  Ticket,
  Gift,
  Sparkles
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../theme';
import { authApi } from '../api/client';
import { useCart } from '../context/CartContext';
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { favoriteIds } = useCart();

  const fetchProfile = async () => {
    try {
      const data = await authApi.getMe();
      setUserData(data);
    } catch (error) {
      console.error('Fetch profile failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn chắc chắn muốn đăng xuất không? Lần sau quét mã QR lại là vào được nha! 👋',
      [
        { text: 'Thôi ở lại', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              // Reset profile về trạng thái khách
              await authApi.updateProfile('', '');
            } catch (_) {}
            navigation.reset({
              index: 0,
              routes: [{ name: 'Scan' }],
            });
          },
        },
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

  const tierColor = userData?.loyaltyTier === 'Gold' ? '#FFD700' : (userData?.loyaltyTier === 'Silver' ? '#C0C0C0' : '#CD7F32');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.lavn, Colors.mint]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Hồ sơ của bạn</Text>
              <TouchableOpacity style={styles.settingsBtn}>
                <Settings size={24} color={Colors.ink} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }]}>
                  <User size={40} color={Colors.ink} />
                </View>
                <TouchableOpacity style={styles.editAvatarBtn}>
                  <Camera size={14} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{userData?.displayName || 'Hi Customer!'}</Text>
                <View style={[styles.tierBadge, { backgroundColor: Colors.ink }]}>
                  <Award size={12} color={tierColor} />
                  <Text style={[styles.tierText, { color: '#fff' }]}>{userData?.loyaltyTier || 'Thành viên mới'}</Text>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Loyalty Card */}
        <View style={styles.loyaltyCard}>
          <LinearGradient
            colors={[Colors.ink, '#333']}
            style={styles.loyaltyGradient}
          >
            <View style={styles.loyaltyHeader}>
              <Text style={styles.loyaltyLabel}>ĐIỂM TÍCH LŨY</Text>
              <Text style={styles.loyaltyPoints}>{userData?.loyaltyPoints || 0}</Text>
            </View>
            <View style={styles.loyaltyFooter}>
              <Text style={styles.loyaltySub}>Quét mã tại quầy để tích thêm điểm nha!</Text>
              <TouchableOpacity style={styles.redeemBtn}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Gift size={14} color={Colors.ink} />
                  <Text style={styles.redeemText}>Đổi quà</Text>
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('OrderHistory')}>
            <Text style={styles.statValue}>{userData?.orderCount || 0}</Text>
            <Text style={styles.statLabel}>Đơn hàng</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{favoriteIds.length}</Text>
            <Text style={styles.statLabel}>Yêu thích</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Vouchers</Text>
          </View>
        </View>

        {/* Action Menu */}
        <View style={styles.menuGroup}>
          <Text style={styles.menuGroupTitle}>ƯU ĐÃI & HOẠT ĐỘNG</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <AtSign size={20} color={Colors.hot} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Xác nhận Tag Story IG</Text>
              <Text style={styles.menuSub}>Tag @bobababe nhận ngay 500 điểm</Text>
            </View>
            <ChevronRight size={18} color={Colors.ink} opacity={0.3} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: Colors.lavn }]}>
              <Ticket size={20} color={Colors.ink} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Kho Voucher của tôi</Text>
              <Text style={styles.menuSub}>Bạn đang có 3 mã sắp hết hạn</Text>
            </View>
            <ChevronRight size={18} color={Colors.ink} opacity={0.3} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: Colors.mint }]}>
              <Heart size={20} color={Colors.ink} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Món ngon đã lưu</Text>
              <Text style={styles.menuSub}>Xem lại danh sách món tủ</Text>
            </View>
            <ChevronRight size={18} color={Colors.ink} opacity={0.3} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuGroup}>
          <Text style={styles.menuGroupTitle}>CÀI ĐẶT</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <User size={20} color={Colors.ink} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Chỉnh sửa thông tin</Text>
            </View>
            <ChevronRight size={18} color={Colors.ink} opacity={0.3} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuIconContainer}>
              <SquareArrowRight size={20} color={Colors.hot} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: Colors.hot }]}>Đăng xuất</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav activeTab="profile" navigation={navigation} />
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
  },
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  header: {
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerTitle: {
    fontFamily: Fonts.display900,
    fontSize: 24,
    color: Colors.ink,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: Colors.ink,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  nameContainer: {
    marginLeft: 20,
  },
  name: {
    fontFamily: Fonts.display800,
    fontSize: 22,
    color: Colors.ink,
    marginBottom: 4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 5,
  },
  tierText: {
    fontFamily: Fonts.display800,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    marginTop: -20,
  },
  loyaltyCard: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.ink,
    shadowColor: Colors.ink,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 25,
  },
  loyaltyGradient: {
    padding: 24,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  loyaltyLabel: {
    fontFamily: Fonts.display800,
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
  },
  loyaltyPoints: {
    fontFamily: Fonts.display900,
    fontSize: 42,
    color: '#fff',
    lineHeight: 45,
  },
  loyaltyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loyaltySub: {
    fontFamily: Fonts.body600,
    fontSize: 11,
    color: '#fff',
    opacity: 0.6,
    flex: 1,
    marginRight: 15,
  },
  redeemBtn: {
    backgroundColor: Colors.mint,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  redeemText: {
    fontFamily: Fonts.display800,
    fontSize: 12,
    color: Colors.ink,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.ink,
    paddingVertical: 18,
    marginBottom: 30,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.display900,
    fontSize: 18,
    color: Colors.ink,
  },
  statLabel: {
    fontFamily: Fonts.body600,
    fontSize: 11,
    color: Colors.ink,
    opacity: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 2,
    backgroundColor: Colors.ink,
    opacity: 0.1,
  },
  menuGroup: {
    marginBottom: 30,
  },
  menuGroupTitle: {
    fontFamily: Fonts.display900,
    fontSize: 13,
    color: Colors.ink,
    opacity: 0.4,
    marginBottom: 15,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.ink,
    padding: 15,
    marginBottom: 12,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,107,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.ink,
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  menuText: {
    fontFamily: Fonts.display800,
    fontSize: 15,
    color: Colors.ink,
  },
  menuSub: {
    fontFamily: Fonts.body600,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.4,
    marginTop: 2,
  },
});
