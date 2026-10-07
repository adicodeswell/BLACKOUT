import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  BackHandler,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { NavIcon } from './NavIcon';

interface MoreMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDestination: (destination: 'Resources' | 'Profile' | 'Settings') => void;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  visible,
  onClose,
  onSelectDestination,
}) => {
  const { theme } = useTheme();

  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true; // Consume event to close modal instead of backing out screen
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.surfaceBorder,
                  borderRadius: theme.radius.lg,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                  More Operational Views
                </Text>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                  <Text style={[styles.closeBtnText, { color: theme.colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Destination 1: Resources */}
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: theme.colors.surfaceBorder }]}
                onPress={() => {
                  onClose();
                  onSelectDestination('Resources');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrapper, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <NavIcon name="Resources" color={theme.colors.primary} size={20} />
                </View>
                <View style={styles.menuTextGroup}>
                  <Text style={[styles.menuTitle, { color: theme.colors.textPrimary }]}>
                    Community Resources
                  </Text>
                  <Text style={[styles.menuSub, { color: theme.colors.textSecondary }]}>
                    Shelters, Food, Water & Medical Points
                  </Text>
                </View>
                <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>→</Text>
              </TouchableOpacity>

              {/* Destination 2: Profile */}
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: theme.colors.surfaceBorder }]}
                onPress={() => {
                  onClose();
                  onSelectDestination('Profile');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrapper, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <NavIcon name="Profile" color={theme.colors.primary} size={20} />
                </View>
                <View style={styles.menuTextGroup}>
                  <Text style={[styles.menuTitle, { color: theme.colors.textPrimary }]}>
                    Node Identity & Fingerprint
                  </Text>
                  <Text style={[styles.menuSub, { color: theme.colors.textSecondary }]}>
                    Public Key & Local Mesh Role
                  </Text>
                </View>
                <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>→</Text>
              </TouchableOpacity>

              {/* Destination 3: Settings */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onSelectDestination('Settings');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrapper, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <NavIcon name="Settings" color={theme.colors.primary} size={20} />
                </View>
                <View style={styles.menuTextGroup}>
                  <Text style={[styles.menuTitle, { color: theme.colors.textPrimary }]}>
                    App Configuration
                  </Text>
                  <Text style={[styles.menuSub, { color: theme.colors.textSecondary }]}>
                    Storage, Engine Adapters & Diagnostics
                  </Text>
                </View>
                <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>→</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 72,
  },
  modalCard: {
    padding: 16,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextGroup: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 11,
  },
  arrow: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
