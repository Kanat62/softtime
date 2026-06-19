import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeTaxInfoSchema, type EmployeeTaxInfo } from '@softtime/shared';
import { useNavigation } from '@react-navigation/native';
import { Input } from '@/shared/ui';
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
import { useProfile } from '@/features/profile/model/useProfile';
import { useEditTaxInfo } from '@/features/profile/edit-tax-info/model/useEditTaxInfo';

function toDateString(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function parseDateInput(val: string): Date | null {
  const m = val.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}`);
  return isNaN(d.getTime()) ? null : d;
}

export function TaxDataScreen() {
  const navigation = useNavigation();
  const { user } = useProfile();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeTaxInfo & { hiredAtInput: string }>({
    resolver: zodResolver(
      employeeTaxInfoSchema.extend({
        hiredAt: employeeTaxInfoSchema.shape.hiredAt.optional(),
      }),
    ),
    defaultValues: {
      inn: null,
      citizenship: null,
      isResident: true,
      hiredAtInput: '',
    } as any,
  });

  const { save, isSaving } = useEditTaxInfo(() => navigation.goBack());

  useEffect(() => {
    if (user) {
      reset({
        inn: user.inn ?? null,
        citizenship: user.citizenship ?? null,
        isResident: user.isResident ?? true,
        hiredAtInput: toDateString(user.hiredAt),
      } as any);
    }
  }, [user]);

  function onSubmit(data: any) {
    save({
      inn: data.inn || null,
      citizenship: data.citizenship || null,
      isResident: data.isResident,
      hiredAt: parseDateInput(data.hiredAtInput ?? ''),
    });
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Назад"
        >
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={iconStrokeWidth} />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Налоговые данные</Text>
        <View style={s.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.fields}>
            <Controller
              control={control}
              name="inn"
              render={({ field }) => (
                <Input
                  label="ИНН (14 цифр)"
                  placeholder="00000000000000"
                  keyboardType="numeric"
                  maxLength={14}
                  value={field.value ?? ''}
                  onChangeText={(v) => field.onChange(v || null)}
                  error={errors.inn?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="citizenship"
              render={({ field }) => (
                <Input
                  label="Гражданство"
                  placeholder="КГ"
                  autoCapitalize="characters"
                  value={field.value ?? ''}
                  onChangeText={(v) => field.onChange(v || null)}
                  error={errors.citizenship?.message}
                />
              )}
            />

            <Controller
              control={control}
              name={"hiredAtInput" as any}
              render={({ field }) => (
                <Input
                  label="Дата начала работы (ДД.ММ.ГГГГ)"
                  placeholder="01.01.2024"
                  keyboardType="numeric"
                  maxLength={10}
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="isResident"
              render={({ field }) => (
                <View style={s.switchRow}>
                  <Text style={s.switchLabel}>Резидент КР</Text>
                  <Switch
                    value={field.value ?? true}
                    onValueChange={field.onChange}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                  />
                </View>
              )}
            />
          </View>

          <Pressable
            style={[s.saveBtn, isSaving && s.saveBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : (
              <Text style={s.saveBtnText}>Сохранить</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
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
  topBarTitle: {
    flex: 1,
    ...typography.lg,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: space[4],
    paddingBottom: space[8],
    gap: space[4],
  },
  fields: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space[4],
    gap: space[4],
    ...(shadows.card as object),
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[2],
  },
  switchLabel: {
    ...typography.base,
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space[4],
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    marginTop: space[2],
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.surface,
  },
});
