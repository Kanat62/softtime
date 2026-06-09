import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Plus, Printer, QrCode as QrIcon, RefreshCw, Trash2 } from "lucide-react";
import { qrApi } from "@/entities/qr/api";
import { networkApi } from "@/entities/office-network/api";
import type { QrToken } from "@/entities/qr/model/types";
import { queryKeys } from "@/shared/api/query-keys";
import { PageHeader, EmptyState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

function fmtDate(iso: string) {
  try {
    return format(new Date(iso), "d MMM yyyy, HH:mm", { locale: ru });
  } catch {
    return iso;
  }
}

const schema = z.object({
  location: z.string().min(1, "Обязательно").max(64),
  networkId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function QrPanel() {
  const qc = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [regenTarget, setRegenTarget] = useState<QrToken | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QrToken | null>(null);
  const printRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { location: "", networkId: undefined },
  });

  const qrQuery = useQuery({ queryKey: queryKeys.qr, queryFn: qrApi.list });
  const networksQuery = useQuery({ queryKey: queryKeys.officeNetworks, queryFn: networkApi.list });

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.qr });

  const generateMutation = useMutation({
    mutationFn: ({ location, networkId }: FormValues) => qrApi.generate(location, networkId),
    onSuccess: () => {
      toast.success("QR-код создан");
      setAddDialogOpen(false);
      form.reset();
      invalidate();
    },
    onError: () => toast.error("Ошибка при создании"),
  });

  const regenMutation = useMutation({
    mutationFn: (id: string) => qrApi.regenerate(id),
    onSuccess: () => {
      toast.success("QR-код обновлён");
      setRegenTarget(null);
      invalidate();
    },
    onError: () => toast.error("Ошибка при обновлении"),
  });

  const deleteMutation = useMutation({
    mutationFn: qrApi.remove,
    onSuccess: () => {
      toast.success("QR-код удалён");
      setDeleteTarget(null);
      invalidate();
    },
    onError: () => toast.error("Ошибка при удалении"),
  });

  function handlePrint(id: string) {
    const el = printRefs.current[id];
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>QR-код</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:sans-serif;}
      .card{text-align:center;padding:32px;}h2{margin-bottom:8px;}p{color:#666;font-size:14px;}</style>
      </head><body><div class="card">
        <div>${el.innerHTML}</div>
        <h2>${el.dataset.location}</h2>
        <p>${el.dataset.code}</p>
      </div></body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  const tokens = (qrQuery.data ?? []).slice(0, 1);
  const networks = networksQuery.data ?? [];
  const hasToken = tokens.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR-коды"
        actions={
          !hasToken ? (
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить QR-код
            </Button>
          ) : undefined
        }
      />

      {qrQuery.isError ? (
        <div className="rounded-2xl bg-card p-12 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Не удалось загрузить данные.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={invalidate}>
            Повторить
          </Button>
        </div>
      ) : qrQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <EmptyState
          icon={<QrIcon className="h-10 w-10" />}
          title="QR-коды не созданы"
          description="Создайте QR-код для каждой локации в офисе."
          action={
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить QR-код
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tokens.map((token) => (
            <div key={token.id} className="flex flex-col rounded-2xl bg-card p-5 shadow-sm">
              <div
                className="flex aspect-square items-center justify-center rounded-xl bg-white p-6"
                ref={(el) => {
                  printRefs.current[token.id] = el;
                }}
                data-location={token.location}
                data-code={token.code}
              >
                <QRCodeSVG value={token.code} size={180} level="M" />
              </div>
              <div className="mt-4">
                <div className="font-semibold text-foreground">{token.location}</div>
                {token.networkId && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Сеть: {networks.find((n) => n.id === token.networkId)?.ssid ?? token.networkId}
                  </div>
                )}
                <div className="mt-1 font-mono text-xs text-muted-foreground">{token.code}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Обновлён: {fmtDate(token.updatedAt)}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePrint(token.id)}
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Печать
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setRegenTarget(token)}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Обновить
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(token)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Новая локация</DialogTitle>
            <DialogDescription>Создайте QR-код для точки check-in в офисе.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => generateMutation.mutate(v))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название локации</FormLabel>
                    <FormControl>
                      <Input placeholder="Главный вход" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {networks.length > 0 && (
                <FormField
                  control={form.control}
                  name="networkId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Офисная сеть (необязательно)</FormLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(v) => field.onChange(v || undefined)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Не привязан" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {networks.map((n) => (
                            <SelectItem key={n.id} value={n.id}>
                              {n.ssid} — {n.cidr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={generateMutation.isPending}>
                  {generateMutation.isPending ? "Создаём..." : "Создать QR"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Regenerate AlertDialog ──────────────────────────────────────────── */}
      <AlertDialog open={!!regenTarget} onOpenChange={(open) => !open && setRegenTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Обновить QR-код?</AlertDialogTitle>
            <AlertDialogDescription>
              Старый код <span className="font-mono font-medium">{regenTarget?.code}</span> для «
              {regenTarget?.location}» станет недействительным. Нужно заменить распечатанный QR на
              новый.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenMutation.isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={regenMutation.isPending}
              onClick={() => regenTarget && regenMutation.mutate(regenTarget.id)}
            >
              {regenMutation.isPending ? "Обновляем..." : "Обновить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete AlertDialog ──────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить QR-код?</AlertDialogTitle>
            <AlertDialogDescription>
              QR для «{deleteTarget?.location}» будет удалён. Сотрудники не смогут сканировать его
              для check-in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Удаляем..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
