import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { dateFnsLocale } from "@/shared/lib/date-locale";
import { toast } from "sonner";
import { Eye, Newspaper, Plus, Trash2 } from "lucide-react";
import { newsApi } from "@/entities/news/api";
import type { News } from "@/entities/news/model/types";
import { queryKeys } from "@/shared/api/query-keys";
import { PageHeader, EmptyState, StatusBadge } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

function fmtDate(iso: string) {
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: dateFnsLocale() });
  } catch {
    return iso;
  }
}

type DialogMode = "create" | "view" | null;

export function NewsManager() {
  const { t } = useTranslation(["news", "common"]);
  const qc = useQueryClient();
  const [mode, setMode] = useState<DialogMode>(null);
  const [activeNews, setActiveNews] = useState<News | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formPhotoUrl, setFormPhotoUrl] = useState("");

  const feedQuery = useQuery({
    queryKey: queryKeys.news,
    queryFn: () => newsApi.list(),
  });

  const readsQuery = useQuery({
    queryKey: ["news", activeNews?.id, "reads"],
    queryFn: () => newsApi.reads(activeNews!.id),
    enabled: mode === "view" && !!activeNews,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.news });

  const deleteMutation = useMutation({
    mutationFn: newsApi.delete,
    onSuccess: () => {
      toast.success(t("news:toast.deleted"));
      setDeleteTargetId(null);
      setMode(null);
      invalidate();
    },
    onError: () => toast.error(t("news:toast.deleteFailed")),
  });

  const createMutation = useMutation({
    mutationFn: newsApi.create,
    onSuccess: () => {
      toast.success(t("news:toast.published"));
      setMode(null);
      invalidate();
    },
    onError: () => toast.error(t("news:toast.publishFailed")),
  });

  function openCreate() {
    setFormTitle("");
    setFormBody("");
    setFormPhotoUrl("");
    setActiveNews(null);
    setMode("create");
  }

  function openView(n: News) {
    setActiveNews(n);
    setMode("view");
  }

  function handleSubmit() {
    if (!formTitle.trim() || !formBody.trim()) {
      toast.error(t("news:titleRequired"));
      return;
    }
    const photoUrl = formPhotoUrl.trim() || null;
    createMutation.mutate({ title: formTitle, body: formBody, photoUrl });
  }

  const news = feedQuery.data?.data ?? [];
  const readStats = readsQuery.data?.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("news:title")}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("news:publish")}
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        {feedQuery.isError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("common:loadFailedShort")}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={invalidate}>
              {t("common:retry")}
            </Button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {[t("news:columns.title"), t("news:columns.date"), t("news:columns.reads"), ""].map((h) => (
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
                {feedQuery.isLoading
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
                          <span className="font-medium text-foreground">{n.title}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {fmtDate(n.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />—
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                openView(n);
                              }}
                            >
                              {t("common:more")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetId(n.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!feedQuery.isLoading && news.length === 0 && (
              <div className="px-6 py-16">
                <EmptyState
                  icon={<Newspaper className="h-10 w-10" />}
                  title={t("news:emptyTitle")}
                  description={t("news:emptyDescription")}
                  action={
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("news:publish")}
                    </Button>
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Dialog: Просмотр новости ──────────────────────────────────────── */}
      <Dialog open={mode === "view"} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="sm:max-w-lg">
          {mode === "view" && activeNews && (
            <>
              <DialogHeader>
                <DialogTitle>{activeNews.title}</DialogTitle>
                <DialogDescription>{fmtDate(activeNews.createdAt)}</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="content" className="flex flex-col overflow-hidden">
                <TabsList className="w-full">
                  <TabsTrigger value="content" className="flex-1">
                    {t("news:view.content")}
                  </TabsTrigger>
                  <TabsTrigger value="readers" className="flex-1">
                    {t("news:view.readers")}
                    {readStats
                      ? ` (${readStats.readCount}/${readStats.total})`
                      : ""}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="mt-4 max-h-80 overflow-y-auto space-y-3">
                  <p className="text-sm leading-relaxed text-foreground">{activeNews.body}</p>
                  {activeNews.photoUrl && (
                    <img
                      src={activeNews.photoUrl}
                      alt={t("news:view.photoAlt")}
                      className="mt-3 w-full rounded-lg object-cover"
                    />
                  )}
                </TabsContent>
                <TabsContent value="readers" className="mt-4 max-h-80 overflow-y-auto space-y-4">
                  {readsQuery.isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full rounded" />
                    ))
                  ) : readsQuery.isError ? (
                    <p className="text-sm text-muted-foreground">{t("news:view.readersLoadFailed")}</p>
                  ) : (
                    <>
                      {(readsQuery.data?.read ?? []).length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-success">
                            {t("news:view.readCount", { count: readsQuery.data!.stats.readCount })}
                          </p>
                          <ul className="space-y-1">
                            {readsQuery.data!.read.map((r) => (
                              <li
                                key={r.userId}
                                className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                              >
                                <span className="text-foreground">{r.fullName}</span>
                                <StatusBadge status="ACTIVE">{t("news:view.read")}</StatusBadge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(readsQuery.data?.unread ?? []).length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("news:view.unreadCount", { count: readsQuery.data!.stats.unreadCount })}
                          </p>
                          <ul className="space-y-1">
                            {readsQuery.data!.unread.map((u) => (
                              <li
                                key={u.userId}
                                className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                              >
                                <span className="text-foreground">{u.fullName}</span>
                                <StatusBadge status="PENDING">{t("news:view.unread")}</StatusBadge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {readsQuery.data &&
                        readsQuery.data.read.length === 0 &&
                        readsQuery.data.unread.length === 0 && (
                          <p className="text-sm text-muted-foreground">{t("news:view.nobodyRead")}</p>
                        )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Подтверждение удаления ───────────────────────────────── */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("news:deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("news:deleteDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTargetId(null)}
              disabled={deleteMutation.isPending}
            >
              {t("common:cancel")}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
            >
              {deleteMutation.isPending ? t("common:deleting") : t("common:delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Создать новость ───────────────────────────────────────── */}
      <Dialog open={mode === "create"} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("news:createDialog.title")}</DialogTitle>
            <DialogDescription>{t("news:createDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="news-title">{t("news:createDialog.titleLabel")}</Label>
              <Input
                id="news-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t("news:createDialog.titlePlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="news-body">{t("news:createDialog.bodyLabel")}</Label>
              <Textarea
                id="news-body"
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder={t("news:createDialog.bodyPlaceholder")}
                rows={7}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="news-photo">{t("news:createDialog.photoLabel")}</Label>
              <Input
                id="news-photo"
                value={formPhotoUrl}
                onChange={(e) => setFormPhotoUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setMode(null)}>
              {t("common:cancel")}
            </Button>
            <Button
              className="flex-1"
              disabled={createMutation.isPending}
              onClick={handleSubmit}
            >
              {createMutation.isPending ? t("news:publishing") : t("news:publish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
