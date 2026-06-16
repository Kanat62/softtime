import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { companyRequisitesSchema, type CompanyRequisites } from "@softtime/shared";
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

type RequisitesValues = CompanyRequisites;

function nullToEmpty(v: string | null | undefined): string {
  return v ?? "";
}

// ── Requisites tab ────────────────────────────────────────────────────────────

function RequisitesTab() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["company-requisites"],
    queryFn: companyApi.getRequisites,
  });

  const form = useForm<RequisitesValues>({
    resolver: zodResolver(companyRequisitesSchema),
    defaultValues: {
      tax_id: null,
      tax_authority_code: null,
      okpo_code: null,
      passport_number: null,
      postal_code: null,
      phone: null,
      address_region: null,
      address_street: null,
      billing_email: null,
      social_fund_reg_number: null,
      highland_coefficient: null,
      soate_code: null,
      gked_code: null,
      legal_form: null,
    },
  });

  useEffect(() => {
    if (query.data) {
      form.reset({
        tax_id: query.data.tax_id,
        tax_authority_code: query.data.tax_authority_code,
        okpo_code: query.data.okpo_code,
        passport_number: query.data.passport_number,
        postal_code: query.data.postal_code,
        phone: query.data.phone,
        address_region: query.data.address_region,
        address_street: query.data.address_street,
        billing_email: query.data.billing_email,
        social_fund_reg_number: query.data.social_fund_reg_number,
        highland_coefficient: query.data.highland_coefficient,
        soate_code: query.data.soate_code,
        gked_code: query.data.gked_code,
        legal_form: query.data.legal_form,
      });
    }
  }, [query.data, form]);

  const mutation = useMutation({
    mutationFn: (values: RequisitesValues) => {
      const normalized: CompanyRequisites = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === "" ? null : v]),
      ) as CompanyRequisites;
      return companyApi.updateRequisites(normalized);
    },
    onSuccess: () => {
      toast.success("Реквизиты сохранены");
      qc.invalidateQueries({ queryKey: ["company-requisites"] });
    },
    onError: (err: unknown) => toast.error(normalizeError(err).message),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => {
          const hasValue = Object.values(v).some((val) => val !== null && val !== "" && val !== undefined);
          if (!hasValue) {
            toast.error("Заполните хотя бы одно поле перед сохранением");
            return;
          }
          mutation.mutate(v);
        })}
        className="space-y-6"
      >
        <p className="text-sm text-muted-foreground">
          Эти данные используются при генерации отчёта СТИ-161. Все поля необязательны
          и могут быть заполнены позже.
        </p>

        {/* ── Налоговые данные ──────────────────────────────────────────── */}
        <div className="rounded-2xl bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground">Налоговые данные</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="tax_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ИНН (102)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="14 цифр"
                      {...field}
                      value={nullToEmpty(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tax_authority_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Код УГНС (104)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Код налогового органа"
                      {...field}
                      value={nullToEmpty(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="social_fund_reg_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Рег. номер страх. взносов (117)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="XXXXX-X"
                      {...field}
                      value={nullToEmpty(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Организационные ───────────────────────────────────────────── */}
        <div className="rounded-2xl bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground">Организационные</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="okpo_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Код ОКПО (107)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={nullToEmpty(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gked_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ГКЭД (131)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="XXXXX-X"
                      {...field}
                      value={nullToEmpty(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="legal_form"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Организационно-правовая форма (ОПФ)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ООО / ОсОО / ИП / ..."
                      {...field}
                      value={nullToEmpty(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="soate_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Код СОАТЭ</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={nullToEmpty(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Контакты и адрес ──────────────────────────────────────────── */}
        <div className="rounded-2xl bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground">Контакты и адрес</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Почтовый индекс (108)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={nullToEmpty(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон (109)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+996 ..."
                      {...field}
                      value={nullToEmpty(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billing_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email для отчётности</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      {...field}
                      value={nullToEmpty(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address_region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Область / Город / Район (110)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={nullToEmpty(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address_street"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Улица / Номер дома (111)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={nullToEmpty(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Прочее ────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground">Прочее</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="passport_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Серия и № паспорта (106, для ИП)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={nullToEmpty(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="highland_coefficient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Коэффициент высокогорья (118)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1.0"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? null : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => query.data && form.reset(query.data as RequisitesValues)}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Сохраняем..." : "Сохранить реквизиты"}
          </Button>
        </div>
      </form>
    </Form>
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
          <TabsTrigger value="requisites">Реквизиты</TabsTrigger>
          <TabsTrigger value="networks">Офисные сети</TabsTrigger>
          <TabsTrigger value="qr">QR-коды</TabsTrigger>
          <TabsTrigger value="audit">Аудит-лог</TabsTrigger>
          <TabsTrigger value="subscription">Подписка</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>

        <TabsContent value="requisites">
          <RequisitesTab />
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
