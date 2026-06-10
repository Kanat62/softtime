import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { normalizeError } from "@/shared/api/error";
import { companyApi } from "@/entities/company/api";
import { useAuth } from "@/entities/session";
import { PageHeader } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { OfficeNetworksTable } from "@/widgets/office-networks-table";
import { QrPanel } from "@/widgets/qr-panel";
import { AuditTable } from "@/widgets/audit-table";
import { SubscriptionCard } from "@/widgets/subscription-card";

// ── Settings form ─────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  minWorkdayHours: z.coerce.number().int().min(1).max(24),
  defaultCheckoutBuffer: z.coerce.number().int().min(0).max(480),
});

type SettingsValues = z.infer<typeof settingsSchema>;

// ── Password form ─────────────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: z.string().min(8, "Минимум 8 символов"),
    confirmPassword: z.string().min(1, "Подтвердите пароль"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

// ── General tab ───────────────────────────────────────────────────────────────

function GeneralTab() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: companyApi.getSettings,
  });

  const settingsForm = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      minWorkdayHours: 6,
      defaultCheckoutBuffer: 60,
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      settingsForm.reset({
        minWorkdayHours: settingsQuery.data.minWorkdayHours,
        defaultCheckoutBuffer: settingsQuery.data.defaultCheckoutBuffer,
      });
    }
  }, [settingsQuery.data, settingsForm]);

  const saveSettingsMutation = useMutation({
    mutationFn: companyApi.updateSettings,
    onSuccess: () => {
      toast.success("Настройки сохранены");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error("Ошибка при сохранении"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      companyApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Пароль изменён");
      passwordForm.reset();
    },
    onError: (err: unknown) => {
      toast.error(normalizeError(err).message);
    },
  });

  function copyCode() {
    const code = user?.companyCode;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Company settings ──────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="font-semibold text-foreground">Настройки компании</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Минимальная длина рабочего дня и буфер автозакрытия
        </p>

        {settingsQuery.isLoading ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <Form {...settingsForm}>
            <form
              onSubmit={settingsForm.handleSubmit((values) => saveSettingsMutation.mutate(values))}
              className="mt-5 space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={settingsForm.control}
                  name="minWorkdayHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Мин. рабочих часов в день</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={24} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={settingsForm.control}
                  name="defaultCheckoutBuffer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Буфер автозакрытия (мин)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={480} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (settingsQuery.data) {
                      settingsForm.reset({
                        minWorkdayHours: settingsQuery.data.minWorkdayHours,
                        defaultCheckoutBuffer: settingsQuery.data.defaultCheckoutBuffer,
                      });
                    }
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={saveSettingsMutation.isPending}>
                  {saveSettingsMutation.isPending ? "Сохраняем..." : "Сохранить"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>

      {/* ── Company code ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="font-semibold text-foreground">Код компании</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Передайте этот код сотрудникам — они используют его при регистрации в мобильном
          приложении.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
            <span className="font-mono text-xl font-semibold tracking-widest text-foreground">
              {user?.companyCode ?? "—"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={copyCode} disabled={!user?.companyCode}>
            {copied ? (
              <Check className="mr-2 h-4 w-4 text-success" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? "Скопировано" : "Скопировать"}
          </Button>
        </div>
      </div>

      {/* ── Password change ───────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="font-semibold text-foreground">Смена пароля</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Минимальная длина пароля — 8 символов
        </p>

        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit(({ currentPassword, newPassword }) =>
              changePasswordMutation.mutate({ currentPassword, newPassword }),
            )}
            className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Текущий пароль</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showCurrentPwd ? "text" : "password"}
                        className="pr-10"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowCurrentPwd((v) => !v)}
                    >
                      {showCurrentPwd ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Новый пароль</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input type={showNewPwd ? "text" : "password"} className="pr-10" {...field} />
                    </FormControl>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowNewPwd((v) => !v)}
                    >
                      {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Подтвердите пароль</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => passwordForm.reset()}>
                Отмена
              </Button>
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? "Меняем..." : "Изменить пароль"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SettingsPanel() {
  return (
    <div className="space-y-6">
      <PageHeader title="Настройки" />

      <Tabs defaultValue="general">
        <TabsList className="mb-2">
          <TabsTrigger value="general">Общие</TabsTrigger>
          <TabsTrigger value="networks">Офисные сети</TabsTrigger>
          <TabsTrigger value="qr">QR-коды</TabsTrigger>
          <TabsTrigger value="audit">Аудит-лог</TabsTrigger>
          <TabsTrigger value="subscription">Подписка</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>

        <TabsContent value="networks">
          <OfficeNetworksTable />
        </TabsContent>

        <TabsContent value="qr">
          <QrPanel />
        </TabsContent>

        <TabsContent value="audit">
          <AuditTable />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
