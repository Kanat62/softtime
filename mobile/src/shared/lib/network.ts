import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';

export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  return isOnline;
}

export interface WifiInfo {
  isWifi: boolean;
  ssid: string | null;
  ipAddress: string | null;
}

export function useWifiInfo(): WifiInfo {
  const [info, setInfo] = useState<WifiInfo>({
    isWifi: false,
    ssid: null,
    ipAddress: null,
  });

  useEffect(() => {
    let cancelled = false;

    function updateFromState(state: NetInfoState) {
      if (cancelled) return;
      if (state.type === 'wifi' && state.details) {
        const d = state.details as { ssid?: string | null; ipAddress?: string | null };
        setInfo({ isWifi: true, ssid: d.ssid ?? null, ipAddress: d.ipAddress ?? null });
      } else {
        setInfo({ isWifi: false, ssid: null, ipAddress: null });
      }
    }

    NetInfo.fetch().then(updateFromState);
    const unsubscribe = NetInfo.addEventListener(updateFromState);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return info;
}
