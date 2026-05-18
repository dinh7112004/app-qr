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
} from 'react-native';
import { ArrowLeft, Heart, ShoppingBag, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../theme';
import { clientApi, cache } from '../api/client';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

const getTranslation = (obj: any, lang = 'vi-VN') => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj['vi-VN'] || '';
};

export default function FavoritesScreen({ navigation }: any) {
  const { favoriteIds, toggleFavorite, session } = useCart();
  
  // Use in-memory cache for instant render
  const cacheKey = `/client/menu?storeId=${session.storeId || 'store-genz-01'}&tableCode=${session.tableCode || 'T12'}`;
  const cachedMenu = cache.get(cacheKey);
  const initialFavorites = cachedMenu?.items?.filter((item: any) => {
    const itemId = item.id || item._id?.toString();
    return itemId && favoriteIds.includes(itemId);
  }) || [];

  const [loading, setLoading] = useState(!cachedMenu);
  const [favoriteItems, setFavoriteItems] = useState<any[]>(initialFavorites);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await clientApi.getMenu(session.storeId || 'store-genz-01', session.tableCode || 'T12');
      if (data && data.items) {
        const allItems = data.items;
        const filtered = allItems.filter((item: any) => {
          const itemId = item.id || item._id?.toString();
          return itemId && favoriteIds.includes(itemId);
        });
        setFavoriteItems(filtered);
      }
    } catch (error) {
      console.error('Fetch favorites failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFavorites(!!cachedMenu);
  }, [favoriteIds]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const renderItem = (item: any) => {
    if (!item) return null;
    const itemId = item.id || item._id?.toString();
    
    return (
      <TouchableOpacity 
        key={itemId} 
        style={styles.itemCard}
        onPress={() => navigation.navigate('ProductDetail', { item })}
      >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <TouchableOpacity 
          style={styles.favBtn} 
          onPress={() => toggleFavorite(itemId)}
        >
          <Heart size={18} color={Colors.hot} fill={Colors.hot} />
        </TouchableOpacity>
        {item.isHot && (
          <View style={styles.hotBadge}>
            <Flame size={12} color="#fff" />
            <Text style={styles.hotText}>HOT</Text>
          </View>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{getTranslation(item.name)}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.itemPrice}>{item.price.toLocaleString()}đ</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('ProductDetail', { item })}>
            <ShoppingBag size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.lavn, Colors.mint]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ArrowLeft size={24} color={Colors.ink} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Món ngon đã lưu</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.hot} />
        </View>
      ) : favoriteItems.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.emptyIconContainer}>
            <Heart size={60} color={Colors.ink} opacity={0.1} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có món tủ nào!</Text>
          <Text style={styles.emptySub}>Hãy nhấn tim những món bạn yêu thích để xem lại ở đây nhé ✨</Text>
          <TouchableOpacity 
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('Menu')}
          >
            <Text style={styles.exploreBtnText}>Khám phá Menu ngay</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.grid}>
            {favoriteItems.map(renderItem)}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#fff',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  itemCard: {
    width: (width - 55) / 2,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.ink,
    overflow: 'hidden',
    marginBottom: 5,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.ink,
  },
  hotBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.hot,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  hotText: {
    fontFamily: Fonts.display900,
    fontSize: 8,
    color: '#fff',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontFamily: Fonts.display800,
    fontSize: 14,
    color: Colors.ink,
    height: 40,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: {
    fontFamily: Fonts.display900,
    fontSize: 16,
    color: Colors.ink,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.ink,
    borderStyle: 'dashed',
    marginBottom: 25,
  },
  emptyTitle: {
    fontFamily: Fonts.display900,
    fontSize: 22,
    color: Colors.ink,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: Fonts.body600,
    fontSize: 14,
    color: Colors.ink,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  exploreBtn: {
    backgroundColor: Colors.ink,
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 18,
    marginTop: 30,
  },
  exploreBtnText: {
    fontFamily: Fonts.display800,
    fontSize: 15,
    color: '#fff',
  }
});
