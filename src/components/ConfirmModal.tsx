import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { Colors, Fonts } from '../theme';
import { vs, s, ms } from '../utils/responsive';

const { width } = Dimensions.get('window');

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  isDestructive?: boolean;
  hideCancel?: boolean;
}

export default function ConfirmModal({ 
  visible, 
  title, 
  message, 
  onCancel, 
  onConfirm, 
  cancelText = 'Thôi ở lại', 
  confirmText = 'Đăng xuất',
  isDestructive = true,
  hideCancel = false
}: ConfirmModalProps) {
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

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.modalContainer,
          { transform: [{ scale: scaleAnim }] }
        ]}>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.footer}>
            {!hideCancel && (
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.button, 
                isDestructive ? styles.confirmButtonDestructive : styles.confirmButton
              ]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.display900,
    fontSize: 22,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontFamily: Fonts.body600,
    fontSize: 15,
    color: Colors.ink,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26,26,26,0.05)',
    backgroundColor: 'rgba(26,26,26,0.02)',
  },
  button: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontFamily: Fonts.display800,
    fontSize: 15,
    color: Colors.ink,
    opacity: 0.6,
  },
  confirmButton: {
    backgroundColor: Colors.ink,
  },
  confirmButtonDestructive: {
    backgroundColor: Colors.hot,
  },
  confirmButtonText: {
    fontFamily: Fonts.display800,
    fontSize: 15,
    color: '#fff',
  },
});
