import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Wifi, X } from 'lucide-react-native';
import { colors, fontFamily, iconStrokeWidth, radius, space } from '@/shared/config/theme';
import { useWorkerNavigation } from '@/shared/navigation/hooks';
import { useCheckIn } from '@/features/attendance/check-in/model/useCheckIn';

const FRAME_SIZE = 260;
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;
const SCAN_DURATION = 1600;
const MOCK_SCAN_DELAY = 2000;

export function QrScannerScreen() {
  const navigation = useWorkerNavigation();
  const { getNextMockResult } = useCheckIn();
  const scanLineY = useRef(new Animated.Value(0)).current;

  // Looping scan line animation
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: FRAME_SIZE - 2,
          duration: SCAN_DURATION,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          toValue: 0,
          duration: SCAN_DURATION,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scanLineY]);

  // Mock scan: navigate to result after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = getNextMockResult();
      navigation.navigate('ScanResult', result);
    }, MOCK_SCAN_DELAY);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Top bar */}
      <SafeAreaView edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={22} color="#fff" strokeWidth={iconStrokeWidth} />
          </TouchableOpacity>
          <Text style={styles.title}>Отметить приход</Text>
          <View style={styles.closeBtn} />
        </View>
      </SafeAreaView>

      {/* Scanner area */}
      <View style={styles.scanner}>
        {/* Overlay: top */}
        <View style={styles.maskV} />

        {/* Frame row */}
        <View style={styles.frameRow}>
          <View style={styles.maskH} />

          {/* Scan frame */}
          <View style={styles.frame}>
            <ScanCorner position="topLeft" />
            <ScanCorner position="topRight" />
            <ScanCorner position="bottomLeft" />
            <ScanCorner position="bottomRight" />
            <Animated.View
              style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
            />
          </View>

          <View style={styles.maskH} />
        </View>

        {/* Overlay: bottom + subtitle */}
        <View style={[styles.maskV, styles.maskVBottom]}>
          <Text style={styles.subtitle}>Наведите камеру на QR-код офиса</Text>
        </View>
      </View>

      {/* WiFi badge */}
      <SafeAreaView edges={['bottom']}>
        <View style={styles.badge}>
          <Wifi size={20} color={colors.success} strokeWidth={iconStrokeWidth} />
          <View style={styles.badgeText}>
            <Text style={styles.badgeTitle}>Офисная сеть подключена</Text>
            <Text style={styles.badgeSub}>SoftTime-Office · 192.168.1.100</Text>
          </View>
          <CheckCircle size={20} color={colors.success} strokeWidth={iconStrokeWidth} />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Corner bracket ───────────────────────────────────────────────────────────

type CornerPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

function ScanCorner({ position }: { position: CornerPosition }) {
  const isTop = position.startsWith('top');
  const isLeft = position.endsWith('Left');

  return (
    <View
      style={[
        styles.corner,
        isTop ? { top: 0 } : { bottom: 0 },
        isLeft ? { left: 0 } : { right: 0 },
      ]}
    >
      {/* Horizontal bar */}
      <View
        style={[
          styles.cornerH,
          isTop ? { top: 0 } : { bottom: 0 },
        ]}
      />
      {/* Vertical bar */}
      <View
        style={[
          styles.cornerV,
          isLeft ? { left: 0 } : { right: 0 },
        ]}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const MASK_COLOR = 'rgba(0,0,0,0.6)';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Top bar
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[4],
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    color: '#fff',
    textAlign: 'center',
  },

  // Scanner
  scanner: {
    flex: 1,
  },
  maskV: {
    flex: 1,
    backgroundColor: MASK_COLOR,
  },
  maskVBottom: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: space[5],
  },
  frameRow: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  maskH: {
    flex: 1,
    backgroundColor: MASK_COLOR,
  },

  // Frame
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerH: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_THICKNESS,
    backgroundColor: colors.primary,
    left: 0,
  },
  cornerV: {
    position: 'absolute',
    width: CORNER_THICKNESS,
    height: CORNER_SIZE,
    backgroundColor: colors.primary,
    top: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary + 'CC',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },

  // WiFi badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: space[4],
    marginBottom: space[4],
    borderRadius: radius.md,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    gap: space[3],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  badgeText: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: '#fff',
  },
  badgeSub: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
});
