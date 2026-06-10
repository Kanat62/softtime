import { useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Clock, Users, BarChart2 } from "lucide-react";
import { loginSchema, type LoginDto } from "@softtime/shared";
import { isNormalizedError } from "@/shared/api/error";
import { useAuth } from "@/entities/session";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const FEATURES = [
  { icon: Clock, label: "Автоматический учёт рабочего времени" },
  { icon: Users, label: "Управление сотрудниками и расписаниями" },
  { icon: BarChart2, label: "Подробная аналитика и отчёты" },
] as const;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginDto) => {
    setSubmitting(true);
    try {
      const user = await login(values.email, values.password);
      toast.success("Вход выполнен");
      navigate({ to: user.role === "PROVIDER" ? "/provider/dashboard" : "/admin/dashboard" });
    } catch (err) {
      if (isNormalizedError(err)) {
        if (err.statusCode === 429) {
          toast.error(err.message);
        } else if (err.statusCode === 0) {
          toast.error("Нет соединения с сервером");
        } else {
          toast.error("Неверный email или пароль");
        }
      } else {
        toast.error("Ошибка соединения с сервером");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Brand panel (desktop only) ──────────────────────────────── */}
      <aside className="hidden lg:flex lg:w-115 xl:w-125 shrink-0 flex-col bg-primary p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <span className="text-sm font-bold tracking-tight">ST</span>
          </div>
          <span className="text-xl font-bold">SoftTime</span>
        </div>

        <div className="mt-auto">
          <h1 className="text-[28px] font-bold leading-snug">
            Управляйте рабочим временем без лишних усилий
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/65">
            Учёт посещаемости, расписания и автоматические отчёты — всё в одном месте.
          </p>

          <ul className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </span>
                <span className="text-sm text-white/75">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="pt-12 text-xs text-white/35">© 2026 SoftTime</p>
      </aside>

      {/* ── Form panel ───────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center bg-background p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <span className="text-sm font-bold">ST</span>
          </div>
          <span className="text-xl font-bold text-foreground">SoftTime</span>
        </div>

        <div className="w-full max-w-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Вход в систему</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Введите email и пароль для доступа к панели управления
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative mt-1.5">
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
              {form.formState.errors.email && (
                <p className="mt-1.5 text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Пароль
              </Label>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Введите пароль"
                  className="pl-9 pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
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
              {form.formState.errors.password && (
                <p className="mt-1.5 text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="mt-2 h-11 w-full text-[15px] font-semibold"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Входим...
                </span>
              ) : (
                "Войти"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Нет аккаунта?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Зарегистрировать компанию
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
