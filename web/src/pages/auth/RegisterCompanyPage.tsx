import { useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Building2,
  User,
  PartyPopper,
  Smartphone,
} from "lucide-react";
import { registerCompanySchema, type RegisterCompanyDto } from "@softtime/shared";
import { useAuth } from "@/entities/session";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function RegisterCompanyPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterCompanyDto>({
    resolver: zodResolver(registerCompanySchema),
    defaultValues: { companyName: "", fullName: "", email: "", password: "" },
  });

  const onSubmit = async (values: RegisterCompanyDto) => {
    setSubmitting(true);
    try {
      const user = await register(values);
      setCreatedCode(user.companyCode ?? null);
    } catch {
      toast.error("Ошибка регистрации. Проверьте данные и попробуйте снова.");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async () => {
    if (!createdCode) return;
    await navigator.clipboard.writeText(createdCode);
    setCopied(true);
    toast.success("Код скопирован");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Brand panel (desktop only) ──────────────────────────────── */}
      <aside className="hidden lg:flex lg:w-115 xl:w-125 shrink-0 flex-col bg-primary p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 overflow-hidden rounded-lg">
            <img src="/softtime-white.png" alt="SoftTime" className="h-9 w-9 object-cover" />
          </div>
          <span className="text-xl font-bold">SoftTime</span>
        </div>

        <div className="mt-auto">
          <h1 className="text-[28px] font-bold leading-snug">
            Начните управлять командой уже сегодня
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/65">
            Регистрация занимает меньше минуты. Первый месяц — бесплатно.
          </p>

          <div className="mt-10 space-y-5">
            <Step num="1" title="Создайте аккаунт компании" desc="Заполните форму и получите код для сотрудников." />
            <Step num="2" title="Пригласите сотрудников" desc="Они укажут код компании в мобильном приложении." />
            <Step num="3" title="Управляйте командой" desc="Расписания, посещаемость, заявки — всё под рукой." />
          </div>
        </div>

        <p className="pt-12 text-xs text-white/35">© 2026 SoftTime</p>
      </aside>

      {/* ── Form / Success panel ─────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center bg-background p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 overflow-hidden rounded-lg">
            <img src="/softtime-icon.png" alt="SoftTime" className="h-9 w-9 object-cover" />
          </div>
          <span className="text-xl font-bold text-foreground">SoftTime</span>
        </div>

        <div className="w-full max-w-100">
          {createdCode ? (
            <SuccessState code={createdCode} copied={copied} onCopy={copy} onContinue={() => navigate({ to: "/admin/dashboard" })} />
          ) : (
            <RegisterForm
              form={form}
              submitting={submitting}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((v) => !v)}
              onSubmit={onSubmit}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────── */

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
        {num}
      </span>
      <div>
        <p className="text-sm font-semibold text-white/90">{title}</p>
        <p className="mt-0.5 text-xs text-white/55">{desc}</p>
      </div>
    </div>
  );
}

function RegisterForm({
  form,
  submitting,
  showPassword,
  onTogglePassword,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<RegisterCompanyDto>>;
  submitting: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  onSubmit: (v: RegisterCompanyDto) => void;
}) {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Создание аккаунта</h2>
        <p className="mt-1.5 text-base text-muted-foreground">
          Зарегистрируйте компанию и получите код для сотрудников
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <Field
          label="Название компании"
          id="companyName"
          error={form.formState.errors.companyName?.message}
          input={
            <div className="relative">
              <Building2
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.5}
              />
              <Input
                id="companyName"
                placeholder="ООО «Компания»"
                className="pl-9"
                {...form.register("companyName")}
              />
            </div>
          }
        />

        <Field
          label="ФИО владельца"
          id="fullName"
          error={form.formState.errors.fullName?.message}
          input={
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.5}
              />
              <Input
                id="fullName"
                placeholder="Иванов Иван Иванович"
                className="pl-9"
                {...form.register("fullName")}
              />
            </div>
          }
        />

        <Field
          label="Email"
          id="email"
          error={form.formState.errors.email?.message}
          input={
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.5}
              />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@company.com"
                className="pl-9"
                {...form.register("email")}
              />
            </div>
          }
        />

        <Field
          label="Пароль"
          id="password"
          error={form.formState.errors.password?.message}
          input={
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.5}
              />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Минимум 8 символов"
                className="pl-9 pr-10"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
          }
        />

        <Button
          type="submit"
          className="mt-2 h-11 w-full text-base font-semibold"
          disabled={submitting}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Создаём...
            </span>
          ) : (
            "Создать аккаунт"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-base text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link
          to="/login"
          className="font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Войти
        </Link>
      </p>
    </>
  );
}

function SuccessState({
  code,
  copied,
  onCopy,
  onContinue,
}: {
  code: string;
  copied: boolean;
  onCopy: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
        <PartyPopper className="h-8 w-8 text-success" strokeWidth={1.5} />
      </div>

      <h2 className="mt-5 text-2xl font-bold text-foreground">Компания создана!</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Передайте этот код сотрудникам — они укажут его при регистрации в мобильном приложении.
      </p>

      {/* Code block */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Код компании
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="font-mono text-3xl font-bold tracking-widest text-primary">{code}</span>
          <button
            type="button"
            onClick={onCopy}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary transition-colors hover:bg-primary/15"
            aria-label="Скопировать код"
          >
            {copied ? (
              <Check className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Copy className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Smartphone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          Сотрудники вводят этот код в мобильном приложении
        </p>
      </div>

      <div className="mt-4 rounded-xl bg-primary-light px-4 py-3 text-left">
        <p className="text-xs text-muted-foreground">
          Первый месяц бесплатно —{" "}
          <span className="font-semibold text-primary">статус TRIAL</span>. После пробного периода
          потребуется оплата подписки.
        </p>
      </div>

      <Button className="mt-6 h-11 w-full text-base font-semibold" onClick={onContinue}>
        Перейти в панель управления
      </Button>
    </div>
  );
}

function Field({
  label,
  id,
  input,
  error,
}: {
  label: string;
  id: string;
  input: ReactNode;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-base font-medium">
        {label}
      </Label>
      <div className="mt-1.5">{input}</div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
