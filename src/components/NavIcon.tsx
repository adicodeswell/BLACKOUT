import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export type NavIconName =
  | 'Home'
  | 'Map'
  | 'Alerts'
  | 'People'
  | 'More'
  | 'Resources'
  | 'Profile'
  | 'Settings'
  | 'FIRE'
  | 'FLOOD'
  | 'MEDICAL'
  | 'BLOCKED_ROAD'
  | 'WATER'
  | 'SHELTER'
  | 'OTHER'
  | 'LOCATION'
  | 'CLOCK'
  | 'CHECK'
  | 'WARNING'
  | 'PLUS'
  | 'EVIDENCE'
  | 'REFRESH'
  | 'NETWORK'
  | 'PEER'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'MESSAGE'
  | 'QUEUE'
  | 'SEND'
  | 'RECEIVE'
  | 'RELAY'
  | 'KEY'
  | 'SECURITY'
  | 'INFO'
  | 'DEVICE'
  | 'FOOD';

interface NavIconProps {
  name: NavIconName;
  color: string;
  size?: number;
}

export const NavIcon: React.FC<NavIconProps> = ({ name, color, size = 20 }) => {
  switch (name) {
    case 'Home':
      return (
        <View style={[styles.iconBox, { width: size, height: size }]}>
          <View
            style={{
              width: 0,
              height: 0,
              backgroundColor: 'transparent',
              borderStyle: 'solid',
              borderLeftWidth: size * 0.45,
              borderRightWidth: size * 0.45,
              borderBottomWidth: size * 0.4,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
            }}
          />
          <View
            style={{
              width: size * 0.65,
              height: size * 0.45,
              backgroundColor: color,
              marginTop: 1,
              borderRadius: 1,
            }}
          />
        </View>
      );

    case 'Map':
      return (
        <View style={[styles.iconBox, { width: size, height: size, flexDirection: 'row', gap: 2 }]}>
          <View style={{ flex: 1, height: size * 0.8, backgroundColor: color, opacity: 0.9, borderRadius: 1, transform: [{ skewY: '-10deg' }] }} />
          <View style={{ flex: 1, height: size * 0.8, backgroundColor: color, opacity: 0.6, borderRadius: 1, transform: [{ skewY: '10deg' }] }} />
          <View style={{ flex: 1, height: size * 0.8, backgroundColor: color, opacity: 0.9, borderRadius: 1, transform: [{ skewY: '-10deg' }] }} />
        </View>
      );

    case 'Alerts':
    case 'WARNING':
      return (
        <View style={[styles.iconBox, { width: size, height: size }]}>
          <View
            style={{
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderLeftWidth: size * 0.45,
              borderRightWidth: size * 0.45,
              borderBottomWidth: size * 0.8,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: size * 0.3,
              width: 2,
              height: size * 0.25,
              backgroundColor: '#0D0F12',
              borderRadius: 1,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: size * 0.62,
              width: 2.5,
              height: 2.5,
              backgroundColor: '#0D0F12',
              borderRadius: 1.25,
            }}
          />
        </View>
      );

    case 'People':
    case 'NETWORK':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center' }]}>
          <View style={{ width: size * 0.8, height: 2, backgroundColor: color, position: 'absolute' }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: size * 0.85 }}>
            <View style={{ width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, backgroundColor: color }} />
            <View style={{ width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16, backgroundColor: color, marginTop: -4 }} />
            <View style={{ width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'More':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'space-around', paddingVertical: 2 }]}>
          <View style={{ width: size * 0.75, height: 2.5, backgroundColor: color, borderRadius: 1.5 }} />
          <View style={{ width: size * 0.75, height: 2.5, backgroundColor: color, borderRadius: 1.5 }} />
          <View style={{ width: size * 0.75, height: 2.5, backgroundColor: color, borderRadius: 1.5 }} />
        </View>
      );

    case 'Resources':
    case 'EVIDENCE':
    case 'QUEUE':
      return (
        <View style={[styles.iconBox, { width: size, height: size }]}>
          <View style={{ width: size * 0.75, height: size * 0.65, borderColor: color, borderWidth: 2, borderRadius: 2, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '100%', height: 1.5, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'Profile':
    case 'PEER':
      return (
        <View style={[styles.iconBox, { width: size, height: size }]}>
          <View style={{ width: size * 0.35, height: size * 0.35, borderRadius: size * 0.175, backgroundColor: color, marginBottom: 2 }} />
          <View style={{ width: size * 0.7, height: size * 0.3, borderTopLeftRadius: size * 0.35, borderTopRightRadius: size * 0.35, backgroundColor: color }} />
        </View>
      );

    case 'Settings':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'space-around', paddingHorizontal: 2 }]}>
          <View style={{ width: '100%', height: 2, backgroundColor: color, justifyContent: 'center' }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, marginLeft: 2 }} />
          </View>
          <View style={{ width: '100%', height: 2, backgroundColor: color, justifyContent: 'center' }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, marginLeft: 10 }} />
          </View>
          <View style={{ width: '100%', height: 2, backgroundColor: color, justifyContent: 'center' }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, marginLeft: 5 }} />
          </View>
        </View>
      );

    case 'FIRE':
      return (
        <View style={[styles.iconBox, { width: size, height: size }]}>
          <View style={{ width: size * 0.5, height: size * 0.7, borderTopLeftRadius: size * 0.25, borderBottomLeftRadius: size * 0.25, borderBottomRightRadius: size * 0.25, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
        </View>
      );

    case 'FLOOD':
    case 'WATER':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'space-around' }]}>
          <View style={{ width: size * 0.8, height: 2.5, backgroundColor: color, borderRadius: 1.25, transform: [{ skewX: '-20deg' }] }} />
          <View style={{ width: size * 0.8, height: 2.5, backgroundColor: color, borderRadius: 1.25, transform: [{ skewX: '20deg' }] }} />
          <View style={{ width: size * 0.8, height: 2.5, backgroundColor: color, borderRadius: 1.25, transform: [{ skewX: '-20deg' }] }} />
        </View>
      );

    case 'MEDICAL':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.3, height: size * 0.8, backgroundColor: color, borderRadius: 1, position: 'absolute' }} />
          <View style={{ width: size * 0.8, height: size * 0.3, backgroundColor: color, borderRadius: 1, position: 'absolute' }} />
        </View>
      );

    case 'BLOCKED_ROAD':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.8, height: size * 0.3, borderColor: color, borderWidth: 2, borderRadius: 2 }} />
        </View>
      );

    case 'SHELTER':
      return (
        <View style={[styles.iconBox, { width: size, height: size }]}>
          <View
            style={{
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderLeftWidth: size * 0.4,
              borderRightWidth: size * 0.4,
              borderBottomWidth: size * 0.7,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
            }}
          />
        </View>
      );

    case 'LOCATION':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3, borderColor: color, borderWidth: 2, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: size * 0.2, height: size * 0.2, borderRadius: size * 0.1, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'CLOCK':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.75, height: size * 0.75, borderRadius: size * 0.375, borderColor: color, borderWidth: 2, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 1.5, height: size * 0.25, backgroundColor: color, position: 'absolute', top: size * 0.1 }} />
            <View style={{ width: size * 0.2, height: 1.5, backgroundColor: color, position: 'absolute', right: size * 0.1 }} />
          </View>
        </View>
      );

    case 'CHECK':
    case 'CONNECTED':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.4, height: size * 0.2, borderColor: color, borderLeftWidth: 2.5, borderBottomWidth: 2.5, transform: [{ rotate: '-45deg' }] }} />
        </View>
      );

    case 'DISCONNECTED':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3, borderColor: color, borderWidth: 2, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: size * 0.4, height: 2, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
          </View>
        </View>
      );

    case 'MESSAGE':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.75, height: size * 0.55, borderColor: color, borderWidth: 2, borderRadius: 3, justifyContent: 'center', alignItems: 'center' }} />
        </View>
      );

    case 'SEND':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: 0, height: 0, borderStyle: 'solid', borderLeftWidth: size * 0.3, borderRightWidth: size * 0.3, borderBottomWidth: size * 0.6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color, transform: [{ rotate: '90deg' }] }} />
        </View>
      );

    case 'RECEIVE':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: 0, height: 0, borderStyle: 'solid', borderLeftWidth: size * 0.3, borderRightWidth: size * 0.3, borderBottomWidth: size * 0.6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color, transform: [{ rotate: '-90deg' }] }} />
        </View>
      );

    case 'RELAY':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.7, height: 2, backgroundColor: color }} />
        </View>
      );

    case 'PLUS':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: 2, height: size * 0.7, backgroundColor: color, position: 'absolute' }} />
          <View style={{ width: size * 0.7, height: 2, backgroundColor: color, position: 'absolute' }} />
        </View>
      );

    case 'REFRESH':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.65, height: size * 0.65, borderRadius: size * 0.325, borderColor: color, borderRightWidth: 2, borderTopWidth: 2, borderBottomWidth: 2 }} />
        </View>
      );

    case 'KEY':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.45, height: size * 0.45, borderRadius: size * 0.225, borderColor: color, borderWidth: 2, position: 'absolute', left: size * 0.1, top: size * 0.1 }} />
          <View style={{ width: size * 0.5, height: 2, backgroundColor: color, position: 'absolute', right: size * 0.15, bottom: size * 0.25, transform: [{ rotate: '-45deg' }] }} />
        </View>
      );

    case 'SECURITY':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.7, height: size * 0.8, borderColor: color, borderWidth: 2, borderBottomLeftRadius: size * 0.35, borderBottomRightRadius: size * 0.35, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
        </View>
      );

    case 'INFO':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.75, height: size * 0.75, borderRadius: size * 0.375, borderColor: color, borderWidth: 2, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color, marginBottom: 2 }} />
            <View style={{ width: 2, height: size * 0.3, backgroundColor: color, borderRadius: 1 }} />
          </View>
        </View>
      );

    case 'DEVICE':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.55, height: size * 0.85, borderColor: color, borderWidth: 2, borderRadius: 4, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 3 }}>
            <View style={{ width: size * 0.15, height: size * 0.15, borderRadius: size * 0.075, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'FOOD':
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.75, height: size * 0.5, borderColor: color, borderWidth: 2, borderBottomLeftRadius: size * 0.25, borderBottomRightRadius: size * 0.25 }} />
        </View>
      );

    case 'OTHER':
    default:
      return (
        <View style={[styles.iconBox, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3, backgroundColor: color }} />
        </View>
      );
  }
};

const styles = StyleSheet.create({
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

