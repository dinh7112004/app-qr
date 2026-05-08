import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform as RNPlatform,
  Animated,
  Vibration,
  PanResponder
} from 'react-native';
import { Camera as CameraIcon, QrCode, Sparkles } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../theme';
import { authApi } from '../api/client';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import ConfirmModal from '../components/ConfirmModal';
import { useCart } from '../context/CartContext';

import { s, vs, ms, SCREEN_WIDTH, SCREEN_HEIGHT } from '../utils/responsive';

const ScanScreen = ({ navigation }: any) => {
  const { clearCart } = useCart();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const hasScanned = useRef(false);
  const [scannedStoreId, setScannedStoreId] = useState('');
  const [scannedTableCode, setScannedTableCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [statusModal, setStatusModal] = useState<{ visible: boolean; title: string; message: string; hideCancel: boolean; confirmText: string }>({
    visible: false,
    title: '',
    message: '',
    hideCancel: true,
    confirmText: 'Đã rõ'
  });

  // Reanimated/Gesture logic for swipe-to-close
  const translateY = useRef(new Animated.Value(0)).current;
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY, velocityY } = event.nativeEvent;
      if (translationY > 150 || velocityY > 1000) {
        // Close modal
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setShowCheckin(false);
          translateY.setValue(0);
        });
      } else {
        // Snap back
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  React.useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const me = await authApi.getMe();
      // If phone starts with 'device-genz', it's a guest account. 
      // If it's a real phone number, the user is verified.
      if (me && me.phone && !me.phone.startsWith('device-genz')) {
        setIsVerified(true);
        setName(me.displayName);
        setPhone(me.phone);
        // We stay on Scan screen to identify the table!
      }
    } catch (error) {
      console.log('Not identified yet');
    }
  };



  const scanAnim = useRef(new Animated.Value(0)).current;
  const bubbleAnims = useRef([
    { x: new Animated.Value(ms(20)), y: new Animated.Value(vs(100)), s: ms(40) },
    { x: new Animated.Value(ms(250)), y: new Animated.Value(vs(150)), s: ms(60) },
    { x: new Animated.Value(ms(100)), y: new Animated.Value(vs(400)), s: ms(30) },
    { x: new Animated.Value(ms(300)), y: new Animated.Value(vs(500)), s: ms(50) },
  ]).current;

  useEffect(() => {
    // Floating bubbles animation
    bubbleAnims.forEach((b, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(b.y, {
            toValue: vs(i % 2 === 0 ? 50 : 200),
            duration: 3000 + i * 500,
            useNativeDriver: true,
          }),
          Animated.timing(b.y, {
            toValue: vs(i % 2 === 0 ? 100 : 250),
            duration: 3000 + i * 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.stopAnimation();
    }
  }, [isScanning]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!isScanning || hasScanned.current) return;

    console.log('Scanned data:', data);

    // data example: https://smartmenu.com/scan?s=store-genz-01&t=B05
    const sMatch = data.match(/[?&](s|store)=([^&]+)/);
    const tMatch = data.match(/[?&](t|table)=([^&]+)/);

    if (sMatch && tMatch) {
      Vibration.vibrate(50);
      hasScanned.current = true;
      setIsScanning(false);
      const sId = sMatch[2];
      const tCode = tMatch[2];
      setScannedStoreId(sId);
      setScannedTableCode(tCode);

      // Reset thông tin cũ để khách mới nhập lại đúng định danh của mình
      setName('');
      setPhone('');
      setShowCheckin(true);
    } else {
      // Cooldown for wrong QR codes to prevent spamming
      if (data.startsWith('http')) {
        hasScanned.current = true;
        Vibration.vibrate(10);
        setStatusModal({
          visible: true,
          title: 'QR hông đúng nè',
          message: 'Bạn vui lòng quét mã QR đặt món tại bàn của quán mình nha!',
          hideCancel: true,
          confirmText: 'Đã rõ'
        });
        setTimeout(() => {
          hasScanned.current = false;
        }, 3000);
      }
    }
  };

  const handleScanPress = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        setStatusModal({
          visible: true,
          title: 'Quyền Camera',
          message: 'Cho quán xin quyền camera để quét mã đặt món nha bạn!',
          hideCancel: true,
          confirmText: 'Đã rõ'
        });
        return;
      }
    }
    hasScanned.current = false;
    setIsScanning(true);
  };

  const handleJoin = async () => {
    if (!name || !phone) {
      setStatusModal({
        visible: true,
        title: 'Thiếu thông tin rồi',
        message: 'Bạn vui lòng nhập đủ tên và số điện thoại để quán nhận diện nha!',
        hideCancel: true,
        confirmText: 'Đã rõ'
      });
      return;
    }

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      setStatusModal({
        visible: true,
        title: 'Lỗi định dạng',
        message: 'Số điện thoại không đúng định dạng',
        hideCancel: true,
        confirmText: 'Đã rõ'
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting to join with:', { name, phone, scannedStoreId, scannedTableCode });

      if (!scannedStoreId || !scannedTableCode) {
        setStatusModal({
          visible: true,
          title: 'Chưa quét mã',
          message: 'Vui lòng quét mã QR tại bàn để quán biết bạn ngồi đâu nha!',
          hideCancel: true,
          confirmText: 'Đã rõ'
        });
        setLoading(false);
        return;
      }

      await authApi.updateProfile(name, phone);
      clearCart();

      console.log('Join successful, navigating to Menu');
      setShowCheckin(false); // Close modal first
      
      navigation.replace('Menu', {
        storeId: scannedStoreId,
        tableCode: scannedTableCode
      });
    } catch (error) {
      console.error('Join failed:', error);
      setStatusModal({
        visible: true,
        title: 'Vào tiệm thất bại',
        message: 'Có lỗi xảy ra, bạn vui lòng thử lại nha!',
        hideCancel: true,
        confirmText: 'Đã rõ'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.lavn, Colors.hot]}
        style={styles.background}
      />
      
      {/* Animated Boba Bubbles */}
      {bubbleAnims.map((b, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bubble,
            {
              width: b.s,
              height: b.s,
              borderRadius: b.s / 2,
              backgroundColor: i % 3 === 0 ? Colors.hot : (i % 3 === 1 ? Colors.lavn : Colors.mint),
              opacity: 0.15,
              transform: [{ translateX: b.x }, { translateY: b.y }]
            }
          ]}
        />
      ))}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Boba Babe</Text>
            <Text style={styles.subtitle}>Quét mã tại bàn để order nha bestie!</Text>
          </View>

          <View style={styles.qrContainer}>
            <View style={styles.qrFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {permission?.granted && isScanning ? (
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  onBarcodeScanned={handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                />
              ) : (
                <TouchableOpacity 
                  style={styles.placeholderCamera} 
                  activeOpacity={0.8}
                  onPress={() => {
                    // Simulation disabled for production
                  }}
                >
                  <QrCode size={120} color={Colors.ink} opacity={0.1} />
                  <Text style={styles.placeholderText}>
                    {!permission?.granted ? 'Cần quyền Camera' : 'Sẵn sàng quét rùi nè!'}
                  </Text>
                </TouchableOpacity>
              )}

              <Animated.View style={[
                styles.scanLine,
                {
                  transform: [{
                    translateY: scanAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-(SCREEN_WIDTH * 0.3), SCREEN_WIDTH * 0.3]
                    })
                  }],
                  opacity: isScanning ? 1 : 0
                }
              ]} />
            </View>
            <View style={styles.tipBubble}>
              <Text style={styles.tipText}>Tip: Đưa camera lại gần mã QR</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.scanBtn}
            onPress={handleScanPress}
          >
            <LinearGradient
              colors={[Colors.ink, '#2D2D2D']}
              style={styles.btnGradient}
            >
              <CameraIcon size={24} color="#fff" />
              <Text style={styles.btnText}>{!permission?.granted ? 'Cho phép Camera' : 'Quét mã tại bàn'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Modal
            visible={showCheckin}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowCheckin(false)}
          >
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardAvoidingView 
                behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={RNPlatform.OS === 'ios' ? 0 : 0}
                style={styles.modalOverlay}
              >
              <PanGestureHandler
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
              >
                <Animated.View 
                  style={[
                    styles.modalContent,
                    { 
                      transform: [{ 
                        translateY: translateY.interpolate({
                          inputRange: [-100, 0, SCREEN_HEIGHT],
                          outputRange: [0, 0, SCREEN_HEIGHT],
                          extrapolate: 'clamp'
                        }) 
                      }] 
                    }
                  ]}
                >
                  <View style={styles.modalIndicatorContainer}>
                    <View style={styles.modalIndicator} />
                  </View>
                <ScrollView
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Chào bạn!</Text>
                    <Text style={styles.modalSub}>Bạn cho quán xin tên và số điện thoại để quán biết phục vụ ai và tích điểm nhận quà nhé!</Text>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Tên của bạn</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập tên để quán gọi bạn nha..."
                      placeholderTextColor="rgba(26,26,26,0.3)"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Số điện thoại</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Dùng để tích điểm nhận quà nè..."
                      placeholderTextColor="rgba(26,26,26,0.3)"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={(text) => {
                        const numericValue = text.replace(/[^0-9]/g, '');
                        if (numericValue.length <= 10) {
                          setPhone(numericValue);
                        }
                      }}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.joinBtn, (loading || !name || !phone) && { opacity: 0.5 }]}
                    onPress={handleJoin}
                    disabled={loading || !name || !phone}
                  >
                    <LinearGradient
                      colors={[Colors.ink, '#2D2D2D']}
                      style={styles.joinGradient}
                    >
                      <Text style={styles.joinBtnText}>{loading ? 'Đang vào...' : 'Vào Menu ngay'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setShowCheckin(false)}
                  >
                    <Text style={styles.closeBtnText}>Để sau nha</Text>
                  </TouchableOpacity>
                </ScrollView>
              </Animated.View>
            </PanGestureHandler>
            </KeyboardAvoidingView>
            </GestureHandlerRootView>
            <ConfirmModal
              visible={statusModal.visible}
              title={statusModal.title}
              message={statusModal.message}
              onCancel={() => setStatusModal(prev => ({ ...prev, visible: false }))}
              onConfirm={() => setStatusModal(prev => ({ ...prev, visible: false }))}
              hideCancel={statusModal.hideCancel}
              confirmText={statusModal.confirmText}
              isDestructive={false}
            />
          </Modal>

          <View style={styles.footer}>
            <Sparkles size={20} color={Colors.ink} opacity={0.4} />
            <Text style={styles.footerText}>Gen-Z Smart Menu System</Text>
          </View>
        </View>
      </SafeAreaView>
      {/* Alert for outside modal (e.g. Scan errors) */}
      {!showCheckin && (
        <ConfirmModal
          visible={statusModal.visible}
          title={statusModal.title}
          message={statusModal.message}
          onCancel={() => setStatusModal(prev => ({ ...prev, visible: false }))}
          onConfirm={() => setStatusModal(prev => ({ ...prev, visible: false }))}
          hideCancel={statusModal.hideCancel}
          confirmText={statusModal.confirmText}
          isDestructive={false}
        />
      )}
    </View>
  );
};

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
  },
  bubble: {
    position: 'absolute',
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontFamily: Fonts.display900,
    fontSize: ms(42),
    color: Colors.ink,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: Fonts.body700,
    fontSize: ms(14),
    color: Colors.ink,
    marginTop: 5,
    textAlign: 'center',
    opacity: 0.5,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SCREEN_HEIGHT * 0.05,
  },
  qrFrame: {
    width: s(280),
    height: s(280),
    backgroundColor: '#fff',
    borderRadius: 30,
    borderWidth: 3,
    borderColor: Colors.ink,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 20,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.hot,
    borderWidth: 6,
    zIndex: 10,
  },
  topLeft: {
    top: -3,
    left: -3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  scanLine: {
    position: 'absolute',
    width: '80%',
    height: 3,
    backgroundColor: Colors.hot,
    top: '50%',
    borderRadius: 2,
    shadowColor: Colors.hot,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    zIndex: 5,
  },
  tipBubble: {
    marginTop: SCREEN_HEIGHT * 0.03,
    backgroundColor: Colors.mint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  tipText: {
    fontFamily: Fonts.display700,
    fontSize: SCREEN_WIDTH > 350 ? 13 : 11,
    color: Colors.ink,
  },
  scanBtn: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    width: '100%',
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SCREEN_WIDTH > 350 ? 18 : 14,
    gap: 12,
  },
  btnText: {
    fontFamily: Fonts.display800,
    fontSize: SCREEN_WIDTH > 350 ? 18 : 16,
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    opacity: 0.5,
    marginTop: 10,
  },
  footerText: {
    fontFamily: Fonts.body700,
    fontSize: 12,
    color: Colors.ink,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: Colors.ink,
    maxHeight: SCREEN_HEIGHT * 0.85,
    padding: 32,
    paddingBottom: RNPlatform.OS === 'ios' ? 50 : 32,
  },
  modalIndicatorContainer: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
  },
  modalIndicator: {
    width: 50,
    height: 6,
    backgroundColor: Colors.ink,
    borderRadius: 3,
    opacity: 0.1,
  },
  modalHeader: {
    marginBottom: SCREEN_WIDTH > 350 ? 25 : 15,
  },
  modalTitle: {
    fontFamily: Fonts.display900,
    fontSize: 28,
    color: Colors.ink,
    textAlign: 'center',
  },
  modalSub: {
    fontFamily: Fonts.body700,
    fontSize: 14,
    color: Colors.ink,
    opacity: 0.5,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  label: {
    fontFamily: Fonts.display800,
    fontSize: 13,
    color: Colors.ink,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: Colors.ink,
    borderRadius: 22,
    padding: 20,
    fontFamily: Fonts.display700,
    fontSize: 16,
    color: Colors.ink,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  placeholderCamera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontFamily: Fonts.body700,
    fontSize: 12,
    color: Colors.ink,
    opacity: 0.3,
    marginTop: 10,
  },
  joinBtn: {
    borderRadius: 30,
    marginTop: 10,
    overflow: 'hidden',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  joinGradient: {
    paddingVertical: SCREEN_WIDTH > 350 ? 20 : 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    fontFamily: Fonts.display800,
    fontSize: 18,
    color: '#fff',
  },
  closeBtn: {
    alignItems: 'center',
    marginTop: 15,
  },
  closeBtnText: {
    fontFamily: Fonts.body700,
    fontSize: 14,
    color: Colors.ink,
    opacity: 0.3,
  },
});

export default ScanScreen;
