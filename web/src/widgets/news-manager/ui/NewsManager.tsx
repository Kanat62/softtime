import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Eye, Newspaper, Pin, Plus, Trash2 } from "lucide-react";
import { newsApi } from "@/entities/news/api";
import type { News } from "@/entities/news/model/types";
import { queryKeys } from "@/shared/api/query-keys";
import { PageHeader, EmptyState, StatusBadge } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Skeleton } from "@/shared/ui/skeleton";
import { Switch } from "@/shared/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

function fmtDate(iso: string) {
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: ru });
  } catch {
    return iso;
  }
}

type SheetMode = "create" | "edit" | "view";

export function NewsManager() {
  const qc = useQueryClient();
  const [sheetMode, setSheetMode] = useState<SheetMode | null>(null);
  const [activeNews, setActiveNews] = useState<News | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<News | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formPinned, setFormPinned] = useState(false);

  const newsQuery = useQuery({
    queryKey: queryKeys.news,
    queryFn: newsApi.list,
  });

  const readersQuery = useQuery({
    queryKey: ["news", activeNews?.id, "readers"],
    queryFn: () => newsApi.readers(activeNews!.id),
    enabled: sheetMode === "view" && !!activeNews,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.news });

  const createMutation = useMutation({
    mutationFn: newsApi.create,
    onSuccess: () => {
      toast.success("Новость опубликована");
      setSheetMode(null);
      invalidate();
    },
    onError: () => toast.error("Ошибка при публикации"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof newsApi.update>[1] }) =>
      newsApi.update(id, dto),
    onSuccess: () => {
      toast.success("Новость обновлена");
      setSheetMode(null);
      invalidate();
    },
    onError: () => toast.error("Ошибка при обновлении"),
  });

  const deleteMutation = useMutation({
    mutationFn: newsApi.remove,
    onSuccess: () => {
      toast.success("Новость удалена");
      setDeleteTarget(null);
      invalidate();
    },
    onError: () => toast.error("Ошибка при удалении"),
  });

  function openCreate() {
    setFormTitle("");
    setFormBody("");
    setFormPinned(false);
    setActiveNews(null);
    setSheetMode("create");
  }

  function openView(n: News) {
    setActiveNews(n);
    setSheetMode("view");
  }

  function openEdit(n: News) {
    setFormTitle(n.title);
    setFormBody(n.body);
    setFormPinned(n.pinned ?? false);
    setActiveNews(n);
    setSheetMode("edit");
  }

  function handleSubmit() {
    if (!formTitle.trim() || !formBody.trim()) {
      toast.error("Заголовок и текст обязательны");
      return;
    }
    if (sheetMode === "create") {
      createMutation.mutate({ title: formTitle, body: formBody, pinned: formPinned });
    } else if (sheetMode === "edit" && activeNews) {
      updateMutation.mutate({
        id: activeNews.id,
        dto: { title: formTitle, body: formBody, pinned: formPinned },
      });
    }
  }

  const news = newsQuery.data ?? [];
  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Новости"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Опубликовать
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {newsQuery.isError ? (
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
                  {["Заголовок", "Дата", "Прочитали", ""].map((h) => (
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
                {newsQuery.isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-48 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-24 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-16 rounded" />
                        </td>
                        <td className="px-4 py-3" />
                      </tr>
                    ))
                  : news.map((n) => (
                      <tr
                        key={n.id}
                        className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                        onClick={() => openView(n)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {n.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-primary" />}
                            <span className="font-medium text-foreground">{n.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {fmtDate(n.publishedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />
                            {n.readCount ?? 0} / {n.totalEmployees ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(n)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!newsQuery.isLoading && news.length === 0 && (
              <div className="px-6 py-16">
                <EmptyState
                  icon={<Newspaper className="h-10 w-10" />}
                  title="Нет новостей"
                  description="Опубликуйте первое объявление для сотрудников."
                  action={
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Опубликовать
                    </Button>
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Dialog: Просмотр новости ──────────────────────────────────────── */}
      <Dialog open={sheetMode === "view"} onOpenChange={(open) => !open && setSheetMode(null)}>
        <DialogContent className="sm:max-w-lg">
          {sheetMode === "view" && activeNews && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {activeNews.pinned && <Pin className="h-4 w-4 text-primary" />}
                  {activeNews.title}
                </DialogTitle>
                <DialogDescription>{fmtDate(activeNews.publishedAt)}</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="content" className="flex flex-col overflow-hidden">
                <TabsList className="w-full">
                  <TabsTrigger value="content" className="flex-1">
                    Содержание
                  </TabsTrigger>
                  <TabsTrigger value="readers" className="flex-1">
                    Читатели ({activeNews.readCount ?? 0}/{activeNews.totalEmployees ?? 0})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="mt-4 max-h-80 overflow-y-auto">
                  <p className="text-sm leading-relaxed text-foreground">{activeNews.body}</p>
                  <div className="mt-6 flex gap-2">
                    <Button size="sm" onClick={() => openEdit(activeNews)}>
                      Редактировать
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setDeleteTarget(activeNews);
                        setSheetMode(null);
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="readers" className="mt-4 max-h-80 overflow-y-auto space-y-4">
                  {readersQuery.isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full rounded" />
                    ))
                  ) : (
                    <>
                      {(readersQuery.data?.read ?? []).length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-success">
                            Прочитали
                          </p>
                          <ul className="space-y-1">
                            {readersQuery.data!.read.map((r) => (
                              <li
                                key={r.userId}
                                className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                              >
                                <span className="text-foreground">{r.fullName}</span>
                                <StatusBadge status="ACTIVE">Прочитано</StatusBadge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(readersQuery.data?.unread ?? []).length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Не читали
                          </p>
                          <ul className="space-y-1">
                            {readersQuery.data!.unread.map((u) => (
                              <li
                                key={u.userId}
                                className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                              >
                                <span className="text-foreground">{u.fullName}</span>
                                <StatusBadge status="PENDING">Не читали</StatusBadge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Создать / Редактировать новость ───────────────────────── */}
      <Dialog
        open={sheetMode === "create" || sheetMode === "edit"}
        onOpenChange={(open) => !open && setSheetMode(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {sheetMode === "create" ? "Новая новость" : "Редактировать новость"}
            </DialogTitle>
            <DialogDescription>Будет опубликована всем активным сотрудникам</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="news-title">Заголовок</Label>
              <Input
                id="news-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Заголовок новости..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="news-body">Текст</Label>
              <Textarea
                id="news-body"
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Текст объявления..."
                rows={7}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Закрепить новость</p>
                <p className="text-xs text-muted-foreground">
                  Отображается в верхней части списка
                </p>
              </div>
              <Switch checked={formPinned} onCheckedChange={setFormPinned} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setSheetMode(null)}>
              Отмена
            </Button>
            <Button className="flex-1" disabled={isMutating} onClick={handleSubmit}>
              {isMutating
                ? "Сохраняем..."
                : sheetMode === "create"
                  ? "Опубликовать"
                  : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete AlertDialog ─────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить новость?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.title}» будет удалена навсегда. Это действие необратимо.
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
