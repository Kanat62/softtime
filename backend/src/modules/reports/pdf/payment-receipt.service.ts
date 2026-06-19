import { Injectable, NotFoundException } from '@nestjs/common'
import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'
import { PaymentStatus } from '@softtime/shared'
import { PrismaService } from '../../../prisma/prisma.service'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fontkitModule = require('@pdf-lib/fontkit')
const fontkit = fontkitModule.default ?? fontkitModule

// Кириллический шрифт — тот же, что и для бланка СТИ-161 (pdf/fonts/Arial.ttf)
const FONT_PATH = path.join(__dirname, 'fonts', 'Arial.ttf')

// Геометрия чека (портретный мини-документ, top-координаты)
const PAGE_W = 420
const PAGE_H = 560
const MARGIN = 40

// ─── Палитра (светлый, печатаемый чек) ────────────────────────────────────────
const INK = rgb(0.09, 0.11, 0.15) // основной текст
const MUTED = rgb(0.45, 0.48, 0.53) // лейблы / второстепенный текст
const HAIRLINE = rgb(0.88, 0.89, 0.91) // разделители
const BRAND = rgb(0.235, 0.435, 0.965) // фирменный синий логотипа

interface StatusBadge {
  label: string
  bg: ReturnType<typeof rgb>
  fg: ReturnType<typeof rgb>
}

const STATUS_BADGES: Record<PaymentStatus, StatusBadge> = {
  [PaymentStatus.PAID]: {
    label: 'Оплачено',
    bg: rgb(0.85, 0.95, 0.87),
    fg: rgb(0.13, 0.5, 0.23),
  },
  [PaymentStatus.FAILED]: {
    label: 'Ошибка оплаты',
    bg: rgb(0.99, 0.89, 0.89),
    fg: rgb(0.7, 0.15, 0.15),
  },
  [PaymentStatus.PENDING]: {
    label: 'Ожидает оплаты',
    bg: rgb(0.99, 0.94, 0.83),
    fg: rgb(0.62, 0.42, 0.05),
  },
}

@Injectable()
export class PaymentReceiptService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Сгенерировать PDF-чек по платежу.
   * @param paymentId id платежа
   * @param companyId компания актора — для tenant-изоляции
   */
  async generateReceiptPdf(paymentId: string, companyId: string): Promise<Buffer> {
    // ── Данные из БД (tenant-изоляция по companyId) ──────────────────────────
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, companyId } as any,
    })
    if (!payment) throw new NotFoundException('Платёж не найден')

    const company = await this.prisma.company.findFirst({
      where: { id: companyId } as any,
      select: { name: true },
    })
    if (!company) throw new NotFoundException('Компания не найдена')

    // Порядковый номер чека в рамках компании (вычисляемое поле, на лету)
    const ordinal = await this.prisma.payment.count({
      where: { companyId, createdAt: { lte: payment.createdAt } } as any,
    })

    // ── Реальные данные ──────────────────────────────────────────────────────
    const amount = Number(payment.amountUsd)
    const paidAt = payment.createdAt
    const status = payment.status as PaymentStatus
    const badge = STATUS_BADGES[status] ?? STATUS_BADGES[PaymentStatus.PENDING]
    const receiptNo = `SOFT-${fmtCompactDate(paidAt)}-${String(ordinal).padStart(4, '0')}`

    // ── Hardcode-поля до интеграции платёжного шлюза ──────────────────────────
    // TODO: заменить когда подключим платёжный шлюз — реальный способ оплаты
    // (тип метода, последние 4 цифры карты и т.п. придут от провайдера).
    const paymentMethod = 'Тестовый платёж'
    // Назначение платежа — статично (один тариф «Подписка SoftTime»).
    const purpose = 'Подписка SoftTime'

    // ── PDF ───────────────────────────────────────────────────────────────────
    const doc = await PDFDocument.create()
    doc.registerFontkit(fontkit)
    const font = await doc.embedFont(fs.readFileSync(FONT_PATH))
    const page = doc.addPage([PAGE_W, PAGE_H])

    // top-координатные помощники (y вниз)
    const text = (
      str: string,
      x: number,
      top: number,
      size: number,
      color = INK,
    ) => page.drawText(str, { x, y: PAGE_H - top - size, size, font, color })

    const textRight = (
      str: string,
      right: number,
      top: number,
      size: number,
      color = INK,
    ) => {
      const w = font.widthOfTextAtSize(str, size)
      text(str, right - w, top, size, color)
    }

    const textCenter = (
      str: string,
      top: number,
      size: number,
      color = INK,
    ) => {
      const w = font.widthOfTextAtSize(str, size)
      text(str, (PAGE_W - w) / 2, top, size, color)
    }

    const hairline = (top: number) =>
      page.drawLine({
        start: { x: MARGIN, y: PAGE_H - top },
        end: { x: PAGE_W - MARGIN, y: PAGE_H - top },
        thickness: 1,
        color: HAIRLINE,
      })

    // ── Шапка: логотип + название слева, бейдж статуса справа ─────────────────
    const logoSize = 30
    const logoTop = MARGIN
    const logoCenterY = PAGE_H - logoTop - logoSize / 2 // центр квадрата (PDF-координаты)

    // Скруглённый квадрат-логотип (у pdf-lib нет borderRadius → SVG-path)
    page.drawSvgPath(roundedRectPath(logoSize, logoSize, 7), {
      x: MARGIN,
      y: PAGE_H - logoTop,
      color: BRAND,
      borderWidth: 0,
    })

    // «S» по центру квадрата (и по горизонтали, и по вертикали)
    const sSize = 18
    const sWidth = font.widthOfTextAtSize('S', sSize)
    page.drawText('S', {
      x: MARGIN + (logoSize - sWidth) / 2,
      y: logoCenterY - (sSize * 0.7) / 2, // ≈ половина cap-height
      size: sSize,
      font,
      color: rgb(1, 1, 1),
    })

    // «SoftTime» — базовая линия выровнена по центру квадрата
    const brandSize = 17
    page.drawText('SoftTime', {
      x: MARGIN + logoSize + 12,
      y: logoCenterY - (brandSize * 0.7) / 2,
      size: brandSize,
      font,
      color: INK,
    })

    drawBadge(page, font, badge, PAGE_W - MARGIN, logoTop + logoSize / 2)

    // ── Центр: «Чек об оплате» + сумма ────────────────────────────────────────
    textCenter('Чек об оплате', 130, 11, MUTED)
    textCenter(`$${amount.toFixed(2)}`, 150, 40)

    hairline(235)

    // ── Блок деталей ──────────────────────────────────────────────────────────
    const rows: [string, string][] = [
      ['Номер чека', receiptNo],
      ['Дата оплаты', fmtDateTime(paidAt)],
      ['Назначение', purpose],
      ['Период', fmtPeriod(payment.periodStart, payment.periodEnd)],
      ['Способ оплаты', paymentMethod],
    ]
    let rowTop = 262
    const rowGap = 30
    for (const [label, value] of rows) {
      text(label, MARGIN, rowTop, 11, MUTED)
      textRight(value, PAGE_W - MARGIN, rowTop, 11)
      rowTop += rowGap
    }

    hairline(rowTop + 4)

    // ── Плательщик ──────────────────────────────────────────────────────────
    text('Плательщик', MARGIN, rowTop + 22, 10, MUTED)
    text(`ОсОО «${company.name}»`, MARGIN, rowTop + 40, 13)

    // ── Подвал ────────────────────────────────────────────────────────────────
    textCenter('Сформировано системой SoftTime · softtime.kg', PAGE_H - MARGIN - 12, 9, MUTED)

    const bytes = await doc.save()
    return Buffer.from(bytes)
  }
}

// ─── Локальные помощники ───────────────────────────────────────────────────────

/** Бейдж-«пилюля»: скруглённые углы, текст по центру. `centerTop` — вертикальный
 *  центр бейджа в top-координатах (для выравнивания с логотипом). */
function drawBadge(
  page: PDFPage,
  font: PDFFont,
  badge: StatusBadge,
  right: number,
  centerTop: number,
) {
  const size = 11
  const padX = 14
  const padY = 7
  const textW = font.widthOfTextAtSize(badge.label, size)
  const w = textW + padX * 2
  const h = size + padY * 2
  const x = right - w
  const top = centerTop - h / 2

  // Скруглённый прямоугольник (pill: радиус = половине высоты)
  page.drawSvgPath(roundedRectPath(w, h, h / 2), {
    x,
    y: PAGE_H - top,
    color: badge.bg,
    borderWidth: 0,
  })

  // Текст по центру (гориз. + верт.)
  const pdfCenterY = PAGE_H - centerTop
  page.drawText(badge.label, {
    x: x + (w - textW) / 2,
    y: pdfCenterY - (size * 0.7) / 2, // ≈ половина cap-height
    size,
    font,
    color: badge.fg,
  })
}

/** SVG-path скруглённого прямоугольника WxH с радиусом r (origin — верхний левый угол). */
function roundedRectPath(w: number, h: number, r: number): string {
  return [
    `M ${r} 0`,
    `H ${w - r}`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `V ${h - r}`,
    `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${h - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join(' ')
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** «DD.MM.YYYY» */
function fmtDate(d: Date): string {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`
}

/** «DD.MM.YYYY, HH:mm» */
function fmtDateTime(d: Date): string {
  return `${fmtDate(d)}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Компактный период с коротким тире. В одном году год пишется только в конце:
 *  «01.06 – 30.06.2026». */
function fmtPeriod(start: Date, end: Date): string {
  const left =
    start.getFullYear() === end.getFullYear()
      ? `${pad2(start.getDate())}.${pad2(start.getMonth() + 1)}`
      : fmtDate(start)
  return `${left} – ${fmtDate(end)}`
}

/** «YYYYMMDD» для номера чека */
function fmtCompactDate(d: Date): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`
}
