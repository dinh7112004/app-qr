import React, { useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  useFonts,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold
} from '@expo-google-fonts/bricolage-grotesque';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
  BeVietnamPro_900Black
} from '@expo-google-fonts/be-vietnam-pro';
import { Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import ScanScreen from './src/screens/ScanScreen';
import MenuScreen from './src/screens/MenuScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import ChatScreen from './src/screens/ChatScreen';
import OrderSuccessScreen from './src/screens/OrderSuccessScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoyaltyStoreScreen from './src/screens/LoyaltyStoreScreen';
import { Colors } from './src/theme';
import { CartProvider } from './src/context/CartContext';


SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Brico-Regular': BricolageGrotesque_400Regular,
    'Brico-SemiBold': BricolageGrotesque_600SemiBold,
    'Brico-Bold': BricolageGrotesque_700Bold,
    'Brico-ExtraBold': BricolageGrotesque_800ExtraBold,
    'Vietnam-Regular': BeVietnamPro_400Regular,
    'Vietnam-Medium': BeVietnamPro_500Medium,
    'Vietnam-SemiBold': BeVietnamPro_600SemiBold,
    'Vietnam-Bold': BeVietnamPro_700Bold,
    'Vietnam-ExtraBold': BeVietnamPro_800ExtraBold,
    'Vietnam-Black': BeVietnamPro_900Black,
    'Hand-Write': Caveat_400Regular,
    'Hand-Write-Bold': Caveat_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.hot} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <CartProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Menu">
            <Stack.Screen name="Scan" component={ScanScreen as any} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="LoyaltyStore" component={LoyaltyStoreScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
