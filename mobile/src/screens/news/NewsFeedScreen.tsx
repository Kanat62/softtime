import React, { useCallback, useState } from 'react';
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
import { Button, EmptyState } from '@/shared/ui';
import { useAuth } from '@/app/providers/AuthProvider';
import { useNewsNavigation } from '@/shared/navigation/hooks';
import { addMockNews, currentMockNews, type NewsWithRead } from '@/entities/news';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

function formatShortDate(date: Date): string {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function NewsFeedScreen() {
  const navigation = useNewsNavigation();
  const { userRole } = useAuth();
  const isAdmin = userRole === UserRole.ADMIN;

  const [newsList, setNewsList]       = useState<NewsWithRead[]>(currentMockNews);
  const [refreshing, setRefreshing]   = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [titleInput, setTitleInput]   = useState('');
  const [bodyInput, setBodyInput]     = useState('');
  const [publishing, setPublishing]   = useState(false);

  const canPublish = titleInput.trim().length > 0 && bodyInput.trim().length > 0 && !publishing;

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setNewsList([...currentMockNews]);
      setRefreshing(false);
    }, 800);
  }, []);

  function handleCardPress(item: NewsWithRead) {
    if (!item.isRead) {
      setNewsList((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );
    }
    navigation.navigate('NewsDetail', { id: item.id });
  }

  function handleCloseSheet() {
    setSheetVisible(false);
    setTitleInput('');
    setBodyInput('');
  }

  async function handlePublish() {
    if (!canPublish) return;
    setPublishing(true);
    await new Promise<void>((r) => setTimeout(r, 1000));

    const newNews: NewsWithRead = {
      id: `news-${Date.now()}`,
      companyId: 'company-001',
      title: titleInput.trim(),
      body: bodyInput.trim(),
      photoUrl: null,
      createdBy: 'user-admin-001',
      createdAt: new Date(),
      isRead: true,
    };

    addMockNews(newNews);
    setNewsList([...currentMockNews]);
    setPublishing(false);
    handleCloseSheet();
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Новости</Text>
      </View>

      {/* Feed */}
      <FlatList
        data={newsList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          newsList.length === 0 && styles.listEmpty,
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <NewsCard item={item} onPress={() => handleCardPress(item)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={
              <Newspaper size={48} color={colors.textDisabled} strokeWidth={iconStrokeWidth} />
            }
            title="Новостей пока нет"
            description="Новости компании появятся здесь"
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Admin FAB */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setSheetVisible(true)}
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
          onTitleChange={setTitleInput}
          onBodyChange={setBodyInput}
          canPublish={canPublish}
          publishing={publishing}
          onClose={handleCloseSheet}
          onPublish={handlePublish}
        />
      )}
    </SafeAreaView>
  );
}

// ─── News card ────────────────────────────────────────────────────────────────

interface NewsCardProps {
  item: NewsWithRead;
  onPress: () => void;
}

function NewsCard({ item, onPress }: NewsCardProps) {
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

// ─── Create news sheet ────────────────────────────────────────────────────────

interface CreateNewsSheetProps {
  visible: boolean;
  titleValue: string;
  bodyValue: string;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  canPublish: boolean;
  publishing: boolean;
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
          {/* Handle */}
          <View style={styles.handle} />

          {/* Sheet header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Создать новость</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={iconStrokeWidth} />
            </TouchableOpacity>
          </View>

          {/* Sheet body */}
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

  // Page header
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

  // Feed list
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

  // News card
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

  // FAB
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

  // Modal overlay
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
  sheetBottom: {
    height: space[4],
  },
});
