import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Printer, Download, QrCode as QrIcon, RefreshCw } from "lucide-react";
import { qrApi } from "@/entities/qr/api";
import { networkApi } from "@/entities/office-network/api";
import { queryKeys } from "@/shared/api/query-keys";
import { useAuth } from "@/entities/session";
import logoUrl from "@/assets/softtime.png";
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function QrPanel() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [regenDialogOpen, setRegenDialogOpen] = useState(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(NO_NETWORK);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Build a nicely formatted printable card on a canvas and return it as a PNG data URL.
  async function buildCardDataUrl(): Promise<string | null> {
    const qrCanvas = qrCanvasRef.current;
    if (!qrCanvas) return null;

    const scale = 2; // crisp on retina / print
    const W = 560;
    const H = 760;
    const canvas = document.createElement("canvas");
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.scale(scale, scale);

    // background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    ctx.textAlign = "center";

    // logo
    try {
      const logo = await loadImage(logoUrl);
      const ls = 72;
      ctx.drawImage(logo, cx - ls / 2, 56, ls, ls);
    } catch {
      /* ignore logo failure */
    }

    // brand name
    ctx.fillStyle = "#111827";
    ctx.font = "700 30px Manrope, system-ui, sans-serif";
    ctx.fillText("SoftTime", cx, 168);

    // company name
    if (user?.companyName) {
      ctx.fillStyle = "#6B7280";
      ctx.font = "500 18px Manrope, system-ui, sans-serif";
      ctx.fillText(user.companyName, cx, 198);
    }

    // QR
    const qrSize = 280;
    const qrX = cx - qrSize / 2;
    const qrY = 232;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // instruction
    ctx.fillStyle = "#6B7280";
    ctx.font = "500 15px Manrope, system-ui, sans-serif";
    ctx.fillText("Отсканируйте для отметки прихода", cx, qrY + qrSize + 48);

    // company code
    if (user?.companyCode) {
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "600 12px Manrope, system-ui, sans-serif";
      ctx.fillText("КОД КОМПАНИИ", cx, qrY + qrSize + 92);
      ctx.fillStyle = "#1877F2";
      ctx.font = "700 34px ui-monospace, Menlo, monospace";
      ctx.fillText(user.companyCode, cx, qrY + qrSize + 132);
    }

    return canvas.toDataURL("image/png");
  }

  async function handleDownload() {
    const url = await buildCardDataUrl();
    if (!url) return toast.error("Не удалось подготовить QR");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${user?.companyCode ?? "softtime"}.png`;
    a.click();
  }

  async function handlePrint() {
    const url = await buildCardDataUrl();
    if (!url) return toast.error("Не удалось подготовить QR");
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Разрешите всплывающие окна для печати");
      return;
    }
    win.document.write(`
      <html><head><title>QR-код — ${user?.companyName ?? "SoftTime"}</title>
      <style>
        @page { margin: 8mm; }
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        img { width: 18cm; max-width: 100%; height: auto; }
      </style>
      </head><body>
        <img src="${url}" onload="window.focus();window.print();" />
      </body></html>`);
    win.document.close();
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
          <div className="flex aspect-square shrink-0 items-center justify-center rounded-xl bg-white p-6">
            <QRCodeSVG value={token.token} size={200} level="M" />
            {/* hidden high-res canvas used to build the printable / downloadable card */}
            <QRCodeCanvas
              ref={qrCanvasRef}
              value={token.token}
              size={560}
              level="M"
              marginSize={2}
              className="hidden"
            />
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
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={handleDownload}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Скачать
              </Button>
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
