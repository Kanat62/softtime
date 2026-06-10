import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import type { WorkerHomeStackParamList } from '@/shared/navigation/types';
import { colors, fontFamily, iconStrokeWidth, radius, space } from '@/shared/config/theme';
import { useWorkerNavigation } from '@/shared/navigation/hooks';
import {
  useAttendanceScan,
  mapScanError,
} from '@/features/attendance/check-in/model/useCheckIn';
import { formatTime } from '@/shared/lib/date';
import { useIsOnline } from '@/shared/lib/network';
import type { CheckInResult, CheckOutResult } from '@softtime/shared';

type QrScannerRoute = RouteProp<WorkerHomeStackParamList, 'QrScanner'>;

const FRAME_SIZE = 260;
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;
const SCAN_DURATION = 1600;

export function QrScannerScreen() {
  const navigation = useWorkerNavigation();
  const route = useRoute<QrScannerRoute>();
  const { mode } = route.params;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const [scanError, setScanError] = useState<string | null>(null);
  const isProcessingRef = useRef(false);
  const isOnline = useIsOnline();

  const scanLineY = useRef(new Animated.Value(0)).current;
  const { mutate, isPending } = useAttendanceScan(mode);

  const title = mode === 'checkIn' ? 'Отметить приход' : 'Отметить уход';

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

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

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (!isOnline || isProcessingRef.current || isPending) return;
      const qrToken = codes[0]?.value;
      if (!qrToken) return;

      isProcessingRef.current = true;
      setScanError(null);

      mutate(qrToken, {
        onSuccess: (result) => {
          const isCheckIn = mode === 'checkIn';
          if (isCheckIn) {
            const r = result as CheckInResult;
            navigation.replace('ScanResult', {
              type: 'checkIn',
              status: r.checkInStatus,
              time: r.record.checkInAt ? formatTime(r.record.checkInAt) : '--:--',
              message: r.message,
              diffMinutes: r.diffMinutes,
            });
          } else {
            const r = result as unknown as CheckOutResult;
            navigation.replace('ScanResult', {
              type: 'checkOut',
              status: r.checkOutStatus,
              time: r.record.checkOutAt ? formatTime(r.record.checkOutAt) : '--:--',
              message: r.message,
              workedMinutes: r.workedMinutes ?? undefined,
              dayStatus: r.dayStatus,
            });
          }
        },
        onError: (err) => {
          setScanError(mapScanError(err as any));
          isProcessingRef.current = false;
        },
      });
    },
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera (behind everything) */}
      {hasPermission && device && !isPending && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={!isProcessingRef.current}
          codeScanner={codeScanner}
        />
      )}

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
          <Text style={styles.title}>{title}</Text>
          <View style={styles.closeBtn} />
        </View>
      </SafeAreaView>

      {/* Scanner overlay */}
      <View style={styles.scanner}>
        <View style={styles.maskV} />
        <View style={styles.frameRow}>
          <View style={styles.maskH} />
          <View style={styles.frame}>
            <ScanCorner position="topLeft" />
            <ScanCorner position="topRight" />
            <ScanCorner position="bottomLeft" />
            <ScanCorner position="bottomRight" />
            {!isPending && (
              <Animated.View
                style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
              />
            )}
          </View>
          <View style={styles.maskH} />
        </View>
        <View style={[styles.maskV, styles.maskVBottom]}>
          <Text style={styles.subtitle}>
            {!hasPermission
              ? 'Нет доступа к камере'
              : 'Наведите камеру на QR-код офиса'}
          </Text>
        </View>
      </View>

      {/* Offline overlay */}
      {!isOnline && (
        <SafeAreaView edges={['bottom']} style={styles.errorContainer}>
          <View style={[styles.errorBanner, styles.offlineBanner]}>
            <Text style={styles.errorText}>Нет подключения к интернету</Text>
          </View>
        </SafeAreaView>
      )}

      {/* Loading overlay */}
      {isPending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Проверяем...</Text>
        </View>
      )}

      {/* Error banner */}
      {scanError && (
        <SafeAreaView edges={['bottom']} style={styles.errorContainer}>
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{scanError}</Text>
            <TouchableOpacity
              onPress={() => setScanError(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.retryText}>Повторить</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Permission denied hint */}
      {!hasPermission && (
        <SafeAreaView edges={['bottom']} style={styles.errorContainer}>
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              Нет доступа к камере. Разрешите в настройках устройства.
            </Text>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

// ─── Corner bracket ────────────────────────────────────────────────────────────

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
      <View style={[styles.cornerH, isTop ? { top: 0 } : { bottom: 0 }]} />
      <View style={[styles.cornerV, isLeft ? { left: 0 } : { right: 0 }]} />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const MASK_COLOR = 'rgba(0,0,0,0.6)';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[3],
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fontFamily.medium,
    color: '#fff',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239,68,68,0.9)',
    marginHorizontal: space[4],
    marginBottom: space[4],
    borderRadius: radius.md,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    gap: space[3],
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#fff',
  },
  retryText: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: '#fff',
    textDecorationLine: 'underline',
  },
  offlineBanner: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
  },
});
