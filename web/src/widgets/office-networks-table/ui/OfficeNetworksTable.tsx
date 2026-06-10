import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Wifi } from "lucide-react";
import { networkApi } from "@/entities/office-network/api";
import type { OfficeNetwork } from "@/entities/office-network/model/types";
import { queryKeys } from "@/shared/api/query-keys";
import { PageHeader, EmptyState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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

const schema = z.object({
  label: z.string().min(1, "Обязательно").max(100),
  cidr: z
    .string()
    .min(1, "Обязательно")
    .regex(
      /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?$/,
      "Формат: 192.168.1.0/24 или 192.168.1.1",
    ),
});

type FormValues = z.infer<typeof schema>;

export function OfficeNetworksTable() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OfficeNetwork | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OfficeNetwork | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { label: "", cidr: "" },
  });

  const networksQuery = useQuery({
    queryKey: queryKeys.officeNetworks,
    queryFn: networkApi.list,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.officeNetworks });

  const createMutation = useMutation({
    mutationFn: networkApi.create,
    onSuccess: () => {
      toast.success("Сеть добавлена");
      closeDialog();
      invalidate();
    },
    onError: () => toast.error("Ошибка при добавлении"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: FormValues }) => networkApi.update(id, dto),
    onSuccess: () => {
      toast.success("Сеть обновлена");
      closeDialog();
      invalidate();
    },
    onError: () => toast.error("Ошибка при обновлении"),
  });

  const deleteMutation = useMutation({
    mutationFn: networkApi.remove,
    onSuccess: () => {
      toast.success("Сеть удалена");
      setDeleteTarget(null);
      invalidate();
    },
    onError: () => toast.error("Ошибка при удалении"),
  });

  function openCreate() {
    setEditTarget(null);
    form.reset({ label: "", cidr: "" });
    setDialogOpen(true);
  }

  function openEdit(n: OfficeNetwork) {
    setEditTarget(n);
    form.reset({ label: n.label, cidr: n.cidr });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditTarget(null);
    form.reset();
  }

  function onSubmit(values: FormValues) {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, dto: values });
    } else {
      createMutation.mutate(values);
    }
  }

  const networks = networksQuery.data ?? [];
  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Офисные сети"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить сеть
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {networksQuery.isError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Не удалось загрузить данные.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={invalidate}>
              Повторить
            </Button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Название", "IP / CIDR", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {networksQuery.isLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-36 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-32 rounded" />
                        </td>
                        <td className="px-4 py-3" />
                      </tr>
                    ))
                  : networks.map((n) => (
                      <tr
                        key={n.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Wifi className="h-4 w-4 shrink-0 text-primary" />
                            <span className="font-medium text-foreground">{n.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {n.cidr}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => openEdit(n)}
                            >
                              Изменить
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(n)}
                            >
                              Удалить
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!networksQuery.isLoading && networks.length === 0 && (
              <div className="px-6 py-16">
                <EmptyState
                  icon={<Wifi className="h-10 w-10" />}
                  title="Нет сетей"
                  description="Добавьте разрешённые IP-диапазоны офисов."
                  action={
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить сеть
                    </Button>
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add / Edit Dialog ───────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Редактировать сеть" : "Добавить сеть"}</DialogTitle>
            <DialogDescription>
              Укажите название и IP-диапазон (CIDR) офисной сети.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input placeholder="Главный офис" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cidr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP / CIDR</FormLabel>
                    <FormControl>
                      <Input placeholder="192.168.1.0/24" className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isMutating}>
                  {isMutating ? "Сохраняем..." : editTarget ? "Сохранить" : "Добавить"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Delete AlertDialog ─────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сеть?</AlertDialogTitle>
            <AlertDialogDescription>
              Сеть{" "}
              <span className="font-medium text-foreground">«{deleteTarget?.label}»</span>{" "}
              ({deleteTarget?.cidr}) будет удалена. Сотрудники из этой сети потеряют возможность
              делать check-in по IP.
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

      {networks.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Check-in через QR возможен только из разрешённых сетей. Если список пуст — проверка сети
          отключена.
        </p>
      )}
    </div>
  );
}
