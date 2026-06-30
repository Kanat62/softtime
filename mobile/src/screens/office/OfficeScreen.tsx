import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MoreHorizontal, Users, X } from 'lucide-react-native';
import { UserRole } from '@softtime/shared';
import {
  colors,
  fontFamily,
  iconSize,
  iconStrokeWidth,
  layout,
  radius,
  shadows,
  space,
  typography,
} from '@/shared/config/theme';
import { Avatar, Button, EmptyState, ErrorState, OfflineBanner, Skeleton } from '@/shared/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { useWorkerNavigation } from '@/shared/navigation/hooks';
import { formatTime } from '@/shared/lib/date';
import type { AttendanceWithUser } from '@/entities/attendance/api/office';
import { useOfficeData } from '@/features/office/model/useOfficeData';
import type { AppError } from '@/shared/api/errors';

// ─── Screen ──────────────────────────────────────────────────────────────────

export function OfficeScreen() {
  const navigation = useWorkerNavigation();
  const { userRole } = useAuth();
  const isAdmin = userRole === UserRole.ADMIN;

  const { entries, isLoading, isError, isAccessDenied, refetch, checkoutMutation } =
    useOfficeData();

  const [selectedEntry, setSelectedEntry] = useState<AttendanceWithUser | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  function handleCloseSheet() {
    setSelectedEntry(null);
    setCheckoutError(null);
    checkoutMutation.reset();
  }

  function handleManualCheckout(checkOutAt: Date) {
    if (!selectedEntry) return;
    setCheckoutError(null);
    checkoutMutation.mutate(
      { id: selectedEntry.id, checkOutAt },
      {
        onSuccess: () => handleCloseSheet(),
        onError: (err) => {
          const appErr = err as unknown as AppError;
          setCheckoutError(
            appErr.isNetworkError
              ? 'Нет подключения к интернету'
              : appErr.message || 'Ошибка при сохранении',
          );
        },
      },
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Назад"
        >
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={iconStrokeWidth} />
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Text style={styles.topBarTitle}>Сейчас в офисе</Text>
          {!isLoading && !isError && !isAccessDenied && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{entries.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.backBtn} />
      </View>
      <OfflineBanner variant="stale" />

      {/* Content */}
      {isLoading ? (
        <OfficeSkeleton />
      ) : isAccessDenied ? (
        <View style={styles.centered}>
          <ErrorState
            title="Нет доступа"
            description="Просмотр офиса доступен после обновления приложения."
          />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <ErrorState onRetry={refetch} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            entries.length === 0 && styles.listContentEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <EmployeeRow
              entry={item}
              isAdmin={isAdmin}
              onMorePress={() => setSelectedEntry(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Users size={48} color={colors.textDisabled} strokeWidth={iconStrokeWidth} />}
              title="Никого ещё нет в офисе"
              description="Список появится после первого чекина"
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Admin: checkout bottom sheet */}
      {isAdmin && (
        <CheckoutSheet
          entry={selectedEntry}
          onClose={handleCloseSheet}
          onSave={handleManualCheckout}
          isSaving={checkoutMutation.isPending}
          saveError={checkoutError}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Employee row ─────────────────────────────────────────────────────────────

interface EmployeeRowProps {
  entry: AttendanceWithUser;
  isAdmin: boolean;
  onMorePress: () => void;
}

function EmployeeRow({ entry, isAdmin, onMorePress }: EmployeeRowProps) {
  const name = entry.user?.fullName ?? 'Сотрудник';
  const avatarUrl = entry.user?.avatarUrl ?? null;
  const timeStr = entry.checkInAt ? formatTime(entry.checkInAt) : '--:--';

  return (
    <View style={styles.row}>
      <Avatar uri={avatarUrl} name={name} size={44} />

      <View style={styles.rowContent}>
        <Text style={styles.rowName}>{name}</Text>
        <Text style={styles.rowTime}>с {timeStr}</Text>
      </View>

      {isAdmin && (
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={onMorePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Действия"
        >
          <MoreHorizontal
            size={iconSize.md}
            color={colors.textSecondary}
            strokeWidth={iconStrokeWidth}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Admin: checkout bottom sheet ─────────────────────────────────────────────

interface CheckoutSheetProps {
  entry: AttendanceWithUser | null;
  onClose: () => void;
  onSave: (checkOutAt: Date) => void;
  isSaving: boolean;
  saveError: string | null;
}

function CheckoutSheet({ entry, onClose, onSave, isSaving, saveError }: CheckoutSheetProps) {
  const now = new Date();
  const [hours, setHours] = useState(now.getHours().toString().padStart(2, '0'));
  const [minutes, setMinutes] = useState(now.getMinutes().toString().padStart(2, '0'));
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSave() {
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
      setValidationError('Введите корректное время (ЧЧ:ММ)');
      return;
    }
    setValidationError(null);
    const checkOutAt = new Date();
    checkOutAt.setHours(h, m, 0, 0);
    onSave(checkOutAt);
  }

  function handleClose() {
    setValidationError(null);
    onClose();
  }

  const displayError = validationError ?? saveError;

  return (
    <Modal
      visible={entry !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Указать время ухода</Text>
              {entry && (
                <Text style={styles.sheetSub}>
                  {entry.user?.fullName ?? 'Сотрудник'}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetBody}>
            <Text style={styles.timeLabel}>Время ухода</Text>
            <View style={styles.timePicker}>
              <View style={styles.timeSegmentWrap}>
                <TextInput
                  style={styles.timeSegment}
                  value={hours}
                  onChangeText={(v) => {
                    setValidationError(null);
                    setHours(v.replace(/\D/g, '').slice(0, 2));
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  placeholder="ЧЧ"
                  placeholderTextColor={colors.textDisabled}
                  editable={!isSaving}
                />
                <Text style={styles.timeSegmentLabel}>часы</Text>
              </View>

              <Text style={styles.timeColon}>:</Text>

              <View style={styles.timeSegmentWrap}>
                <TextInput
                  style={styles.timeSegment}
                  value={minutes}
                  onChangeText={(v) => {
                    setValidationError(null);
                    setMinutes(v.replace(/\D/g, '').slice(0, 2));
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  placeholder="ММ"
                  placeholderTextColor={colors.textDisabled}
                  editable={!isSaving}
                />
                <Text style={styles.timeSegmentLabel}>минуты</Text>
              </View>
            </View>

            {displayError && (
              <Text style={styles.timeError}>{displayError}</Text>
            )}

            <Button
              variant="primary"
              size="full"
              onPress={handleSave}
              loading={isSaving}
            >
              Сохранить
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function OfficeSkeleton() {
  return (
    <View style={[styles.listContent, { gap: space[2] }]}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.row, { gap: space[3] }]}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <View style={{ flex: 1, gap: space[2] }}>
            <Skeleton width={140} height={14} />
            <Skeleton width={80} height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
  },

  // Top bar
  topBar: {
    height: layout.topBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[4],
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  topBarTitle: {
    ...typography.lg,
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#fff',
    lineHeight: 14,
  },

  // List
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[3],
    paddingBottom: space[8],
  },
  listContentEmpty: {
    flex: 1,
  },
  separator: {
    height: space[2],
  },

  // Employee row
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  rowTime: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  moreBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: space[8],
    ...(shadows.lg as object),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginTop: space[3],
    marginBottom: space[2],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingVertical: space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    ...typography.lg,
    color: colors.textPrimary,
  },
  sheetSub: {
    ...typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sheetBody: {
    paddingHorizontal: space[5],
    paddingTop: space[5],
    gap: space[4],
  },
  timeLabel: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[3],
  },
  timeSegmentWrap: {
    alignItems: 'center',
    gap: 6,
  },
  timeSegment: {
    width: 88,
    height: 64,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    textAlign: 'center',
    fontSize: 32,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  timeSegmentLabel: {
    ...typography.xs,
    color: colors.textSecondary,
  },
  timeColon: {
    fontSize: 32,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: 20,
  },
  timeError: {
    ...typography.sm,
    color: colors.danger,
    textAlign: 'center',
  },
});
