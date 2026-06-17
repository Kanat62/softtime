import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Printer, QrCode as QrIcon, RefreshCw } from "lucide-react";
import { qrApi } from "@/entities/qr/api";
import { networkApi } from "@/entities/office-network/api";
import { queryKeys } from "@/shared/api/query-keys";
import { PageHeader, EmptyState } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Label } from "@/shared/ui/label";

function fmtDate(iso: string) {
  try {
    return format(new Date(iso), "d MMM yyyy, HH:mm", { locale: ru });
  } catch {
    return iso;
  }
}

const NO_NETWORK = "__none__";

export function QrPanel() {
  const qc = useQueryClient();
  const [regenDialogOpen, setRegenDialogOpen] = useState(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(NO_NETWORK);
  const printRef = useRef<HTMLDivElement | null>(null);

  const qrQuery = useQuery({
    queryKey: queryKeys.qr,
    queryFn: qrApi.getActive,
  });

  const networksQuery = useQuery({
    queryKey: queryKeys.officeNetworks,
    queryFn: networkApi.list,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.qr });

  const regenMutation = useMutation({
    mutationFn: (officeNetworkId: string | null) => qrApi.regenerate(officeNetworkId),
    onSuccess: () => {
      toast.success("QR-код обновлён");
      setRegenDialogOpen(false);
      invalidate();
    },
    onError: () => toast.error("Ошибка при обновлении QR"),
  });

  function openRegenDialog() {
    setSelectedNetworkId(qrQuery.data?.officeNetworkId ?? NO_NETWORK);
    setRegenDialogOpen(true);
  }

  function handleConfirmRegen() {
    const networkId = selectedNetworkId === NO_NETWORK ? null : selectedNetworkId;
    regenMutation.mutate(networkId);
  }

  function handlePrint() {
    const el = printRef.current;
    if (!el || !qrQuery.data) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const network = networks.find((n) => n.id === qrQuery.data!.officeNetworkId);
    win.document.write(`
      <html><head><title>QR-код</title>
      <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; }
        .card { text-align: center; padding: 32px; }
        p { color: #666; font-size: 13px; margin: 4px 0; }
      </style>
      </head><body><div class="card">
        <div>${el.innerHTML}</div>
        ${network ? `<p>${network.label}</p>` : ""}
        <p style="font-family:monospace;font-size:11px;color:#999">${qrQuery.data!.token.slice(0, 16)}…</p>
      </div></body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  const token = qrQuery.data;
  const networks = networksQuery.data ?? [];
  const linkedNetwork = networks.find((n) => n.id === token?.officeNetworkId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR-код"
        actions={
          token ? (
            <Button size="sm" variant="outline" onClick={openRegenDialog}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Перегенерировать
            </Button>
          ) : undefined
        }
      />

      {qrQuery.isError ? (
        <div className="rounded-2xl bg-card p-12 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Не удалось загрузить QR-код.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={invalidate}>
            Повторить
          </Button>
        </div>
      ) : qrQuery.isLoading ? (
        <Skeleton className="h-80 w-full rounded-2xl" />
      ) : !token ? (
        <div className="rounded-2xl bg-card p-12 shadow-sm">
          <EmptyState
            icon={<QrIcon className="h-10 w-10" />}
            title="QR-код не создан"
            description="Создайте QR-код для check-in сотрудников в офисе."
            action={
              <Button size="sm" onClick={openRegenDialog}>
                Создать QR-код
              </Button>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-start">
          <div
            ref={printRef}
            className="flex aspect-square shrink-0 items-center justify-center rounded-xl bg-white p-6"
          >
            <QRCodeSVG value={token.token} size={200} level="M" />
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Привязанная сеть
              </p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {linkedNetwork ? `${linkedNetwork.label} — ${linkedNetwork.cidr}` : "Без привязки"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Создан
              </p>
              <p className="mt-0.5 text-sm text-foreground">{fmtDate(token.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Токен
              </p>
              <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
                {token.token}
              </p>
            </div>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Печать
              </Button>
              <Button variant="outline" size="sm" onClick={openRegenDialog}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Перегенерировать
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Regenerate / Create Dialog ──────────────────────────────────────── */}
      <AlertDialog open={regenDialogOpen} onOpenChange={(open) => !open && setRegenDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {token ? "Перегенерировать QR-код?" : "Создать QR-код"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {token
                ? "Старый QR-код станет недействительным. Замените распечатанный QR на новый."
                : "Будет создан QR-код для check-in сотрудников."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 px-1">
            <Label htmlFor="qr-network">Офисная сеть (необязательно)</Label>
            <Select value={selectedNetworkId} onValueChange={setSelectedNetworkId}>
              <SelectTrigger id="qr-network">
                <SelectValue placeholder="Без привязки к сети" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_NETWORK}>Без привязки</SelectItem>
                {networks.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.label} — {n.cidr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenMutation.isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={regenMutation.isPending}
              onClick={handleConfirmRegen}
            >
              {regenMutation.isPending
                ? "Создаём..."
                : token
                  ? "Перегенерировать"
                  : "Создать"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
