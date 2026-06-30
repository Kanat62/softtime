import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Newspaper, Plus, X } from 'lucide-react-native';
import { UserRole } from '@softtime/shared';
import type { AppError } from '@/shared/api/errors';
import {
  colors,
  fontFamily,
  iconStrokeWidth,
  layout,
  radius,
  shadows,
  space,
  typography,
} from '@/shared/config/theme';
import { Button, EmptyState, ErrorState, OfflineBanner, Skeleton } from '@/shared/ui';
import { useIsOnline } from '@/shared/lib/network';
import { useAuth } from '@/app/providers/AuthProvider';
import { useNewsNavigation } from '@/shared/navigation/hooks';
import type { NewsWithRead } from '@/entities/news/api/news';
import { useNewsFeed } from '@/features/news/feed/model/useNewsFeed';
import { useCreateNews } from '@/features/news/create/model/useCreateNews';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

function formatShortDate(date: Date): string {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

function mapCreateError(err: AppError): string {
  if (err.isNetworkError) return 'Нет соединения. Проверьте интернет.';
  if (err.statusCode === 403) return 'Нет прав для публикации новостей.';
  return err.message ?? 'Не удалось опубликовать новость.';
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function NewsFeedScreen() {
  const navigation = useNewsNavigation();
  const { userRole } = useAuth();
  const isAdmin = userRole === UserRole.ADMIN;

  const { items, isLoading, isRefreshing, isError, refetch, markReadOptimistic } = useNewsFeed();
  const createMutation = useCreateNews();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [titleInput, setTitleInput]     = useState('');
  const [bodyInput, setBodyInput]       = useState('');
  const isOnline = useIsOnline();

  const canPublish = isOnline && titleInput.trim().length > 0 && bodyInput.trim().length > 0 && !createMutation.isPending;

  function handleCardPress(item: NewsWithRead) {
    markReadOptimistic(item.id);
    navigation.navigate('NewsDetail', { id: item.id });
  }

  function handleCloseSheet() {
    setSheetVisible(false);
    setTitleInput('');
    setBodyInput('');
    createMutation.reset();
  }

  function handlePublish() {
    if (!canPublish) return;
    createMutation.mutate(
      { title: titleInput.trim(), body: bodyInput.trim() },
      { onSuccess: handleCloseSheet },
    );
  }

  const publishError = createMutation.isError
    ? mapCreateError(createMutation.error as unknown as AppError)
    : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Новости</Text>
      </View>
      <OfflineBanner variant="block" />

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={isLoading ? null : items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            !isLoading && items.length === 0 && styles.listEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <NewsCard item={item} onPress={() => handleCardPress(item)} />
          )}
          ListHeaderComponent={isLoading ? <FeedSkeleton /> : null}
          ListEmptyComponent={
            isLoading ? null : (
              <EmptyState
                icon={
                  <Newspaper size={48} color={colors.textDisabled} strokeWidth={iconStrokeWidth} />
                }
                title="Новостей пока нет"
                description="Новости компании появятся здесь"
              />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Admin FAB */}
      {isAdmin && (
        <TouchableOpacity
          style={[styles.fab, !isOnline && styles.fabDisabled]}
          onPress={() => { if (isOnline) setSheetVisible(true); }}
          activeOpacity={0.85}
          accessibilityLabel="Создать новость"
        >
          <Plus size={24} color={colors.surface} strokeWidth={iconStrokeWidth} />
        </TouchableOpacity>
      )}

      {/* Create news sheet (admin only) */}
      {isAdmin && (
        <CreateNewsSheet
          visible={sheetVisible}
          titleValue={titleInput}
          bodyValue={bodyInput}
          onTitleChange={(v) => { setTitleInput(v); if (createMutation.isError) createMutation.reset(); }}
          onBodyChange={(v) => { setBodyInput(v); if (createMutation.isError) createMutation.reset(); }}
          canPublish={canPublish}
          publishing={createMutation.isPending}
          publishError={publishError}
          onClose={handleCloseSheet}
          onPublish={handlePublish}
        />
      )}
    </SafeAreaView>
  );
}

// ─── News card ────────────────────────────────────────────────────────────────

function NewsCard({ item, onPress }: { item: NewsWithRead; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardMeta}>
        <View style={styles.newsBadge}>
          <Text style={styles.newsBadgeText}>Новость</Text>
        </View>
        <Text style={styles.cardDate}>{formatShortDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
      <Text style={styles.readMore}>Читать далее →</Text>
    </TouchableOpacity>
  );
}

// ─── Feed loading skeleton ────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <View style={{ gap: space[3] }}>
      {([0, 1, 2] as const).map((i) => (
        <View key={i} style={styles.card}>
          <View style={[styles.cardMeta, { justifyContent: 'flex-start', gap: space[3] }]}>
            <Skeleton width={60} height={22} borderRadius={11} />
            <Skeleton width={80} height={12} />
          </View>
          <Skeleton width={220} height={16} />
          <Skeleton width="100%" height={12} />
          <Skeleton width={160} height={12} />
        </View>
      ))}
    </View>
  );
}

// ─── Create news sheet ────────────────────────────────────────────────────────

interface CreateNewsSheetProps {
  visible: boolean;
  titleValue: string;
  bodyValue: string;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  canPublish: boolean;
  publishing: boolean;
  publishError: string | null;
  onClose: () => void;
  onPublish: () => void;
}

function CreateNewsSheet({
  visible,
  titleValue,
  bodyValue,
  onTitleChange,
  onBodyChange,
  canPublish,
  publishing,
  publishError,
  onClose,
  onPublish,
}: CreateNewsSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Создать новость</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.sheetBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={styles.sheetInput}
                value={titleValue}
                onChangeText={onTitleChange}
                placeholder="Заголовок новости"
                placeholderTextColor={colors.textDisabled}
              />
              <TextInput
                style={styles.sheetTextarea}
                value={bodyValue}
                onChangeText={onBodyChange}
                placeholder="Текст новости..."
                placeholderTextColor={colors.textDisabled}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              {publishError ? (
                <View style={styles.publishError}>
                  <Text style={styles.publishErrorText}>{publishError}</Text>
                </View>
              ) : null}

              <Button
                variant="primary"
                size="full"
                onPress={onPublish}
                disabled={!canPublish}
                loading={publishing}
              >
                Опубликовать
              </Button>
              <View style={styles.sheetBottom} />
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  pageHeader: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  pageTitle: {
    ...typography.xl,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },

  list: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: space[8],
  },
  listEmpty: {
    flex: 1,
  },
  separator: {
    height: space[3],
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[4],
    gap: space[2],
  },
  cardUnread: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: '#F0C050',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
  },
  newsBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    color: colors.primary,
  },
  cardDate: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  cardTitle: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  cardBody: {
    ...typography.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  readMore: {
    ...typography.sm,
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },

  fab: {
    position: 'absolute',
    bottom: space[5],
    right: space[5],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(shadows.lg as object),
  },
  fabDisabled: {
    backgroundColor: colors.textDisabled,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
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
    alignItems: 'center',
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
  sheetBody: {
    paddingHorizontal: space[5],
    paddingTop: space[4],
    gap: space[3],
  },
  sheetInput: {
    height: 48,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space[4],
    ...typography.base,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },
  sheetTextarea: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    minHeight: 130,
    ...typography.base,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },
  publishError: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  publishErrorText: {
    ...typography.sm,
    color: colors.dangerText,
    fontFamily: fontFamily.medium,
  },
  sheetBottom: {
    height: space[4],
  },
});
