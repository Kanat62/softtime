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
import { Check, Wifi, WifiOff, X } from 'lucide-react-native';
import { useRoute, useIsFocused } from '@react-navigation/native';
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
import { useIsOnline, useWifiInfo } from '@/shared/lib/network';
import type { CheckInResult, CheckOutResult } from '@softtime/shared';

type QrScannerRoute = RouteProp<WorkerHomeStackParamList, 'QrScanner'>;

const FRAME_SIZE = 260;
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;
const SCAN_DURATION = 1600;
const MASK_COLOR = 'rgba(0,0,0,0.78)';

export function QrScannerScreen() {
  const navigation = useWorkerNavigation();
  const route = useRoute<QrScannerRoute>();
  const { mode } = route.params;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const [scanError, setScanError] = useState<string | null>(null);
  const isProcessingRef = useRef(false);
  const isFocused = useIsFocused();
  const isOnline = useIsOnline();
  const wifiInfo = useWifiInfo();

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

  const wifiLabel = wifiInfo.isWifi ? 'Офисная сеть подключена' : 'WiFi не обнаружен';
  const wifiSublabel = wifiInfo.isWifi
    ? [wifiInfo.ssid, wifiInfo.ipAddress ? maskLastOctet(wifiInfo.ipAddress) : null]
        .filter(Boolean)
        .join(' · ') || null
    : null;

  const hasError = !!scanError || !isOnline || !hasPermission;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera layer */}
      {hasPermission && device && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused && !isPending}
          codeScanner={codeScanner}
        />
      )}

      {/* Main layout overlay */}
      <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>

        {/* Top mask: close button + title */}
        <View style={styles.topMask}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={20} color="#fff" strokeWidth={iconStrokeWidth} />
          </TouchableOpacity>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Наведите камеру на QR-код офиса</Text>
          </View>
        </View>

        {/* Frame row: side masks + transparent scanner frame */}
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

        {/* Bottom mask: WiFi status card */}
        <View style={styles.bottomMask}>
          <WifiStatusCard
            isWifi={wifiInfo.isWifi}
            label={wifiLabel}
            sublabel={wifiSublabel}
          />
        </View>
      </SafeAreaView>

      {/* Loading overlay */}
      {isPending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Проверяем...</Text>
        </View>
      )}

      {/* Error / offline banners */}
      {hasError && (
        <SafeAreaView edges={['bottom']} style={styles.bannerContainer}>
          {!isOnline ? (
            <View style={[styles.banner, styles.bannerNeutral]}>
              <Text style={styles.bannerText}>Нет подключения к интернету</Text>
            </View>
          ) : !hasPermission ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                Нет доступа к камере. Разрешите в настройках устройства.
              </Text>
            </View>
          ) : scanError ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>{scanError}</Text>
              <TouchableOpacity
                onPress={() => setScanError(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.bannerRetry}>Повторить</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </SafeAreaView>
      )}
    </View>
  );
}

// ─── WiFi status card ─────────────────────────────────────────────────────────

function WifiStatusCard({
  isWifi,
  label,
  sublabel,
}: {
  isWifi: boolean;
  label: string;
  sublabel: string | null;
}) {
  return (
    <View style={wifiStyles.card}>
      <View style={[wifiStyles.iconWrap, isWifi ? wifiStyles.iconWrapActive : wifiStyles.iconWrapInactive]}>
        {isWifi
          ? <Wifi size={20} color={colors.success} strokeWidth={iconStrokeWidth} />
          : <WifiOff size={20} color="rgba(255,255,255,0.45)" strokeWidth={iconStrokeWidth} />}
      </View>
      <View style={wifiStyles.info}>
        <Text style={wifiStyles.label}>{label}</Text>
        {sublabel ? <Text style={wifiStyles.sublabel}>{sublabel}</Text> : null}
      </View>
      <View style={[wifiStyles.badge, isWifi ? wifiStyles.badgeActive : wifiStyles.badgeInactive]}>
        {isWifi
          ? <Check size={14} color="#fff" strokeWidth={2.5} />
          : <WifiOff size={14} color="rgba(255,255,255,0.5)" strokeWidth={iconStrokeWidth} />}
      </View>
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function maskLastOctet(ip: string): string {
  return ip.replace(/\.\d+$/, '.x');
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  wrapper: {
    flex: 1,
  },
  topMask: {
    flex: 1,
    backgroundColor: MASK_COLOR,
    paddingHorizontal: space[4],
    paddingTop: space[2],
    paddingBottom: space[8],
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    gap: space[2],
  },
  title: {
    fontSize: 26,
    fontFamily: fontFamily.bold,
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.55)',
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
  bottomMask: {
    flex: 1,
    backgroundColor: MASK_COLOR,
    paddingHorizontal: space[4],
    justifyContent: 'flex-end',
    paddingBottom: space[4],
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[3],
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fontFamily.medium,
    color: '#fff',
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239,68,68,0.92)',
    marginHorizontal: space[4],
    marginBottom: space[4],
    borderRadius: radius.md,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    gap: space[3],
  },
  bannerNeutral: {
    backgroundColor: 'rgba(30,30,30,0.95)',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#fff',
  },
  bannerRetry: {
    fontSize: 13,
    fontFamily: fontFamily.semiBold,
    color: '#fff',
    textDecorationLine: 'underline',
  },
});

const wifiStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    gap: space[3],
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  iconWrapInactive: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontSize: 14,
    fontFamily: fontFamily.semiBold,
    color: '#fff',
  },
  sublabel: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.45)',
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: colors.success,
  },
  badgeInactive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
