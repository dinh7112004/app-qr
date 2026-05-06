import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { CheckCircle2, AlertCircle, X } from 'lucide-react-native';
import { Colors, Fonts } from '../theme';

const { width } = Dimensions.get('window');

interface StatusModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  confirmText?: string;
}

export default function StatusModal({ visible, type, title, message, onClose, confirmText = 'OK' }: StatusModalProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={48} color="#2E7D32" />;
      case 'error':
        return <AlertCircle size={48} color="#C62828" />;
      default:
        return <AlertCircle size={48} color={Colors.ink} />;
    }
  };

  const getThemeColor = () => {
    switch (type) {
      case 'success': return '#E8F5E9';
      case 'error': return '#FFEBEE';
      default: return Colors.paper;
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.modalContainer,
          { transform: [{ scale: scaleAnim }] }
        ]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color={Colors.ink} opacity={0.3} />
          </TouchableOpacity>

          <View style={[styles.iconContainer, { backgroundColor: getThemeColor() }]}>
            {getIcon()}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{confirmText}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.ink,
    shadowColor: Colors.ink,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  title: {
    fontFamily: Fonts.display900,
    fontSize: 20,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontFamily: Fonts.body600,
    fontSize: 14,
    color: Colors.ink,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 25,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.hot,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.ink,
    width: '100%',
  },
  buttonText: {
    fontFamily: Fonts.display800,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});
