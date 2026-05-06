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
  KeyboardAvoidingView,
  Platform as RNPlatform,
  Animated,
  Vibration
} from 'react-native';
import { Camera as CameraIcon, QrCode, Sparkles } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../theme';
import { authApi } from '../api/client';
import StatusModal from '../components/StatusModal';

const { width, height } = Dimensions.get('window');

const ScanScreen = ({ navigation }: any) => {
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
  const [statusModal, setStatusModal] = useState<{ visible: boolean; type: 'success' | 'error' | 'info'; title: string; message: string }>({
    visible: false,
    type: 'info',
    title: '',
    message: ''
  });

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

  useEffect(() => {
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
    const sMatch = data.match(/[?&]s=([^&]+)/);
    const tMatch = data.match(/[?&]t=([^&]+)/);
    
    if (sMatch && tMatch) {
      Vibration.vibrate(50);
      hasScanned.current = true;
      setIsScanning(false);
      const sId = sMatch[1];
      const tCode = tMatch[1];
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
          type: 'error',
          title: 'QR hông đúng nè',
          message: 'Bạn vui lòng quét mã QR đặt món tại bàn của quán mình nha! 🥤'
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
          type: 'info',
          title: 'Quyền Camera',
          message: 'Cho quán xin quyền camera để quét mã đặt món nha bạn! 📸'
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
        type: 'info',
        title: 'Thiếu thông tin rồi',
        message: 'Nhập đủ tên và số điện thoại để quán nhận diện bạn nhé! 💖'
      });
      return;
    }
    
    try {
      setLoading(true);
      if (!scannedStoreId || !scannedTableCode) {
        setStatusModal({
          visible: true,
          type: 'info',
          title: 'Chưa quét mã',
          message: 'Vui lòng quét mã QR tại bàn để quán biết bạn ngồi đâu nha! 📸🥤'
        });
        setLoading(false);
        return;
      }

      await authApi.updateProfile(name, phone);
      
      navigation.replace('Menu', {
        storeId: scannedStoreId || 'store-genz-01',
        tableCode: scannedTableCode || 'A12'
      });
    } catch (error) {
      alert('Vào tiệm thất bại, thử lại nha! 😢');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={[Colors.hot, Colors.lavn, Colors.mint]} 
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Boba Babe ✨</Text>
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
                <View style={styles.placeholderCamera}>
                  <QrCode size={120} color={Colors.ink} opacity={0.1} />
                  <Text style={styles.placeholderText}>
                    {!permission?.granted ? 'Cần quyền Camera' : 'Sẵn sàng quét rùi nè! ✨'}
                  </Text>
                </View>
              )}
              
              <Animated.View style={[
                styles.scanLine,
                {
                  transform: [{
                    translateY: scanAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-(width * 0.3), width * 0.3]
                    })
                  }],
                  opacity: isScanning ? 1 : 0
                }
              ]} />
            </View>
            <View style={styles.tipBubble}>
              <Text style={styles.tipText}>Tip: Đưa camera lại gần mã QR 📸</Text>
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
              <Text style={styles.btnText}>{!permission?.granted ? 'Cho phép Camera' : 'Quét mã tại bàn ✨'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Modal
            visible={showCheckin}
            animationType="slide"
            transparent={true}
          >
            <KeyboardAvoidingView 
              behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalOverlay}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chào bestie! 👋</Text>
                  <Text style={styles.modalSub}>Bestie cho quán xin tên và số điện thoại để quán biết phục vụ ai và tích điểm nhận quà nhé! ✨</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Tên của bạn ✨</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="Ví dụ: Công chúa Tuyết..."
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Số điện thoại 📱</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="Để tích điểm nhận quà nè..."
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.joinBtn, loading && { opacity: 0.7 }]}
                  onPress={handleJoin}
                  disabled={loading}
                >
                  <Text style={styles.joinBtnText}>{loading ? 'Đang vào tiệm...' : 'Bắt đầu Order ngay ✨'}</Text>
                </TouchableOpacity>

              </View>
            </KeyboardAvoidingView>
          </Modal>

          <View style={styles.footer}>
            <Sparkles size={20} color={Colors.ink} opacity={0.4} />
            <Text style={styles.footerText}>Gen-Z Smart Menu System</Text>
          </View>
        </View>
      </SafeAreaView>
      <StatusModal 
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
      />
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
    height: height * 0.4,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
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
    fontSize: width * 0.1,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: Fonts.body700,
    fontSize: width * 0.04,
    color: '#fff',
    marginTop: 5,
    textAlign: 'center',
    opacity: 0.9,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: height * 0.05,
  },
  qrFrame: {
    width: width * 0.7,
    height: width * 0.7,
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
    marginTop: height * 0.03,
    backgroundColor: Colors.mint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  tipText: {
    fontFamily: Fonts.display700,
    fontSize: width > 350 ? 13 : 11,
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
    paddingVertical: width > 350 ? 18 : 14,
    gap: 12,
  },
  btnText: {
    fontFamily: Fonts.display800,
    fontSize: width > 350 ? 18 : 16,
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
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: width * 0.08,
    paddingBottom: RNPlatform.OS === 'ios' ? 45 : 30,
  },
  modalHeader: {
    marginBottom: width > 350 ? 25 : 15,
  },
  modalTitle: {
    fontFamily: Fonts.display800,
    fontSize: width > 350 ? 24 : 20,
    color: Colors.ink,
  },
  modalSub: {
    fontFamily: Fonts.body600,
    fontSize: width > 350 ? 14 : 12,
    color: Colors.ink,
    opacity: 0.5,
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: width > 350 ? 20 : 12,
  },
  label: {
    fontFamily: Fonts.display800,
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    backgroundColor: Colors.paper,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 20,
    padding: width > 350 ? 18 : 14,
    fontFamily: Fonts.body600,
    fontSize: 16,
    color: Colors.ink,
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
    backgroundColor: Colors.ink,
    paddingVertical: width > 350 ? 20 : 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
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
