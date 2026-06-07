import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserCheck, UserX } from 'lucide-react-native';
import type { User } from '@softtime/shared';
import { Avatar, EmptyState } from '@/shared/ui';
import {
  colors,
  fontFamily,
  iconStrokeWidth,
  radius,
  space,
  typography,
} from '@/shared/config/theme';

interface PendingEmployeesProps {
  workers: User[];
}

export function PendingEmployees({ workers }: PendingEmployeesProps) {
  const [items, setItems] = useState<User[]>(workers);

  function handleAccept(id: string) {
    setItems((prev) => prev.filter((w) => w.id !== id));
  }

  function handleReject(id: string) {
    setItems((prev) => prev.filter((w) => w.id !== id));
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<UserCheck size={40} color={colors.textDisabled} strokeWidth={iconStrokeWidth} />}
        title="Нет новых заявок"
        description="Все сотрудники подтверждены"
      />
    );
  }

  return (
    <View style={s.list}>
      {items.map((worker, idx) => (
        <React.Fragment key={worker.id}>
          {idx > 0 && <View style={s.divider} />}
          <PendingRow
            worker={worker}
            onAccept={() => handleAccept(worker.id)}
            onReject={() => handleReject(worker.id)}
          />
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

interface PendingRowProps {
  worker: User;
  onAccept: () => void;
  onReject: () => void;
}

function PendingRow({ worker, onAccept, onReject }: PendingRowProps) {
  return (
    <View style={s.row}>
      <Avatar uri={worker.avatarUrl} name={worker.fullName} size={44} />

      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{worker.fullName}</Text>
        <Text style={s.email} numberOfLines={1}>{worker.email}</Text>
      </View>

      <View style={s.actions}>
        <TouchableOpacity
          style={[s.actionBtn, s.rejectBtn]}
          onPress={onReject}
          activeOpacity={0.85}
          accessibilityLabel="Отклонить"
        >
          <UserX size={16} color={colors.surface} strokeWidth={iconStrokeWidth} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.actionBtn, s.acceptBtn]}
          onPress={onAccept}
          activeOpacity={0.85}
          accessibilityLabel="Принять"
        >
          <UserCheck size={16} color={colors.surface} strokeWidth={iconStrokeWidth} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  list: {
    gap: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
    gap: space[3],
    minHeight: 64,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.base,
    fontFamily: fontFamily.semiBold,
    color: colors.textPrimary,
  },
  email: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: space[2],
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: colors.danger,
  },
  acceptBtn: {
    backgroundColor: colors.success,
  },
});
