import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeTaxInfoSchema, type EmployeeTaxInfo, type User } from '@softtime/shared';
import { Input } from '@/shared/ui';
import {
  colors,
  fontFamily,
  radius,
  space,
  typography,
} from '@/shared/config/theme';
import { useEditTaxInfo } from '../model/useEditTaxInfo';

interface Props {
  visible: boolean;
  user: User | null;
  onClose: () => void;
}

function toDateString(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function parseDateInput(val: string): Date | null {
  const m = val.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}`);
  return isNaN(d.getTime()) ? null : d;
}

export function TaxInfoForm({ visible, user, onClose }: Props) {
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
    },
  });

  const { save, isSaving } = useEditTaxInfo(onClose);

  useEffect(() => {
    if (visible && user) {
      reset({
        inn: user.inn ?? null,
        citizenship: user.citizenship ?? null,
        isResident: user.isResident ?? true,
        hiredAtInput: toDateString(user.hiredAt),
      } as any);
    }
  }, [visible, user]);

  function onSubmit(data: any) {
    save({
      inn: data.inn || null,
      citizenship: data.citizenship || null,
      isResident: data.isResident,
      hiredAt: parseDateInput(data.hiredAtInput ?? ''),
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.handle} />
          <Text style={s.title}>Налоговые данные</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
          </ScrollView>

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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space[4],
    paddingTop: space[3],
    paddingBottom: space[8],
    gap: space[4],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: space[1],
  },
  title: {
    ...typography.lg,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  fields: {
    gap: space[4],
    paddingBottom: space[2],
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
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.surface,
  },
});
