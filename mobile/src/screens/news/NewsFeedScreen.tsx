import React, { useState } from 'react';
import {
  FlatList,
  Image,
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
import { ImageIcon, Newspaper, Plus, X } from 'lucide-react-native';
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

const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

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
  const [photoUrlInput, setPhotoUrlInput] = useState('');
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
    setPhotoUrlInput('');
    createMutation.reset();
  }

  function handlePublish() {
    if (!canPublish) return;
    createMutation.mutate(
      {
        title: titleInput.trim(),
        body: bodyInput.trim(),
        photoUrl: photoUrlInput.trim() || null,
      },
      { onSuccess: handleCloseSheet },
    );
  }

  const publishError = createMutation.isError
    ? mapCreateError(createMutation.error as unknown as AppError)
    : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
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
                icon={<Newspaper size={48} color={colors.textDisabled} strokeWidth={iconStrokeWidth} />}
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

      {/* Create news modal (admin only) — centered so keyboard doesn't cover inputs */}
      {isAdmin && (
        <CreateNewsModal
          visible={sheetVisible}
          titleValue={titleInput}
          bodyValue={bodyInput}
          photoUrlValue={photoUrlInput}
          onTitleChange={(v) => { setTitleInput(v); if (createMutation.isError) createMutation.reset(); }}
          onBodyChange={(v) => { setBodyInput(v); if (createMutation.isError) createMutation.reset(); }}
          onPhotoUrlChange={setPhotoUrlInput}
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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Photo (task 6) */}
      {item.photoUrl ? (
        <Image
          source={{ uri: item.photoUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.cardMeta}>
        <View style={styles.newsBadge}>
          <Text style={styles.newsBadgeText}>Новость</Text>
        </View>
        {/* Task 8: unread → primary dot instead of date */}
        {item.isRead ? (
          <Text style={styles.cardDate}>{formatShortDate(item.createdAt)}</Text>
        ) : (
          <View style={styles.unreadDot} />
        )}
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>

      {/* Task 8: date below card for unread */}
      {!item.isRead && (
        <Text style={styles.cardDateBelow}>{formatShortDate(item.createdAt)}</Text>
      )}

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

// ─── Create news modal (centered) — task 2 ────────────────────────────────────

interface CreateNewsModalProps {
  visible: boolean;
  titleValue: string;
  bodyValue: string;
  photoUrlValue: string;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onPhotoUrlChange: (v: string) => void;
  canPublish: boolean;
  publishing: boolean;
  publishError: string | null;
  onClose: () => void;
  onPublish: () => void;
}

function CreateNewsModal({
  visible,
  titleValue,
  bodyValue,
  photoUrlValue,
  onTitleChange,
  onBodyChange,
  onPhotoUrlChange,
  canPublish,
  publishing,
  publishError,
  onClose,
  onPublish,
}: CreateNewsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalKAV}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalBox} onPress={() => {}}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Создать новость</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
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
                numberOfLines={5}
                textAlignVertical="top"
              />

              {/* Task 7: image URL input */}
              <View style={styles.photoInputWrap}>
                <ImageIcon size={16} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
                <TextInput
                  style={styles.photoInput}
                  value={photoUrlValue}
                  onChangeText={onPhotoUrlChange}
                  placeholder="URL картинки (необязательно)"
                  placeholderTextColor={colors.textDisabled}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              {/* Preview image if URL provided */}
              {photoUrlValue.trim().length > 0 && (
                <Image
                  source={{ uri: photoUrlValue.trim() }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                />
              )}

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
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  pageHeader: { height: 56, justifyContent: 'center', paddingHorizontal: layout.screenPadding },
  pageTitle: { ...typography.xl, fontFamily: fontFamily.bold, color: colors.textPrimary },

  list: { paddingHorizontal: layout.screenPadding, paddingBottom: space[8] },
  listEmpty: { flex: 1 },
  separator: { height: space[3] },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    gap: space[2],
    paddingBottom: space[4],
  },
  cardImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingTop: space[4],
  },
  newsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
  },
  newsBadgeText: { fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.primary },
  cardDate: { ...typography.sm, color: colors.textSecondary },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  cardTitle: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
    paddingHorizontal: space[4],
  },
  cardBody: {
    ...typography.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: space[4],
  },
  cardDateBelow: {
    ...typography.xs,
    color: colors.textDisabled,
    paddingHorizontal: space[4],
  },
  readMore: {
    ...typography.sm,
    fontFamily: fontFamily.medium,
    color: colors.primary,
    paddingHorizontal: space[4],
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
  fabDisabled: { backgroundColor: colors.textDisabled },

  // Centered modal (task 2)
  modalKAV: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space[4],
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    width: '100%',
    maxHeight: '85%',
    ...(shadows.lg as object),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[5],
    paddingVertical: space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { ...typography.lg, color: colors.textPrimary },
  modalBody: {
    paddingHorizontal: space[5],
    paddingTop: space[4],
    paddingBottom: space[5],
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
    minHeight: 110,
    ...typography.base,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },

  // Task 7: photo URL input
  photoInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space[3],
    height: 44,
  },
  photoInput: {
    flex: 1,
    ...typography.sm,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },
  photoPreview: {
    width: '100%',
    height: 140,
    borderRadius: radius.md,
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
});
