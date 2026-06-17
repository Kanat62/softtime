import { Injectable, NotFoundException } from '@nestjs/common'
import { PDFDocument, PDFPage, LineCapStyle, rgb } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fontkitModule = require('@pdf-lib/fontkit')
const fontkit = fontkitModule.default ?? fontkitModule

export type DocumentType = 'INITIAL' | 'REVISED' | 'LIQUIDATION'

export interface Sti161Employee {
  inn: string | null
  fullName: string
  citizenship: string | null
  isResident: boolean
  workStartDate: Date | null
  daysWorked: number
  totalIncome: number | null
  incomeTax: number | null
  socialContributions: number | null
}

export interface Sti161PdfInput {
  documentType: DocumentType
  companyName: string
  taxId: string | null
  taxAuthorityCode: string | null
  taxAuthorityName: string | null
  okpoCode: string | null
  socialFundRegNumber: string | null
  highlandCoefficient: string | null
  socialTariffType: string | null
  smz: string | null
  usmz: string | null
  periodMonth: number
  periodYear: number
  employees: Sti161Employee[]
}

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'sti-161-blank.pdf')
const FONT_PATH = path.join(__dirname, 'fonts', 'Arial.ttf')

const PAGE_W = 841.5
const PAGE_H = 594.75

// Центры чекбоксов типа документа (cx, cy — top-координаты, измерено по бланку)
const DOC_TYPE_COORDS: Record<DocumentType, { cx: number; cy: number }> = {
  INITIAL:     { cx: 70.1,  cy: 56.1 },
  REVISED:     { cx: 174.9, cy: 56.1 },
  LIQUIDATION: { cx: 257.1, cy: 56.1 },
}

// Раздел I — свободный текст (наименования, не по клеткам)
const F = {
  NAME:     { x: 422, top: 87  }, // 103 наименование плательщика
  TAX_NAME: { x: 120, top: 108 }, // 104 наименование налогового органа
}

// Раздел I — поля-«гребёнки»: по одному символу в клетку.
// x0 — левая стенка первой клетки, pitch — шаг клетки, count — число клеток,
// cy — центр клетки по вертикали (top-координата). Измерено по бланку.
const COMB = {
  inn:     { x0: 118.3, pitch: 14.671, count: 14, cy: 90.7 }, // 102 ИНН
  taxCode: { x0: 51.4,  pitch: 15.77,  count: 3,  cy: 112  }, // 104 КОД органа
  okpo:    { x0: 625.8, pitch: 14.65,  count: 8,  cy: 112  }, // 107 ОКПО
  reg:     { x0: 51.4,  pitch: 14.66,  count: 12, cy: 133  }, // 117 рег. номер
  koef:    { x0: 351.7, pitch: 14.67,  count: 3,  cy: 133  }, // 118 коэффициент
  tarif:   { x0: 627.5, pitch: 14.67,  count: 3,  cy: 133  }, // 119 вид тарифа
  smz:     { x0: 80.7,  pitch: 14.68,  count: 5,  cy: 146  }, // 120 СМЗ
  usmz:    { x0: 347.5, pitch: 14.68,  count: 5,  cy: 146  }, // 121 УСМЗ
}

// Даты 201/202 — клетки сгруппированы ДД ММ ГГГГ (8 цифр), явные центры клеток
const DATE_FROM_CX = [255.9, 270.55, 290.45, 305.1, 325.45, 340.1, 354.75, 369.45]
const DATE_TO_CX   = [433.45, 448.1, 467.9, 482.55, 502.9, 517.6, 532.3, 546.9]
const DATE_CY = 162

// Раздел III — колонки (start = левый край, w = ширина, pt).
// Координаты измерены напрямую с линий бланка sti-161-blank.pdf.
const COLS: Record<string, { start: number; w: number }> = {
  num:         { start: 23.51,  w: 16.91 }, // 1. №
  inn:         { start: 40.42,  w: 86.96 }, // 2. ИНН
  name:        { start: 127.38, w: 59.53 }, // 3. Ф.И.О.
  category:    { start: 186.91, w: 36.84 }, // 4. Категория
  citizenship:   { start: 223.75, w: 28.33 }, // 5. Гражданство
  residency:     { start: 252.08, w: 36.87 }, // 6. Резидентство
  workStartDate: { start: 288.95, w: 35.22 }, // 7. Дата начала работы
  // 8 — дата окончания (не заполняем)
  daysWorked:    { start: 358.20, w: 24.30 }, // 9. Дней факт
  incomeCode:  { start: 382.50, w: 22.67 }, // 10. Код дохода
  totalIncome: { start: 405.17, w: 39.66 }, // 11. Сумма начисленных доходов
  // 12-17 — не заполняем (нет данных)
  taxTotal:    { start: 701.84, w: 34.98 }, // 18. Всего ПН
  socialContr: { start: 736.82, w: 42.22 }, // 19. Страховые взносы
  // 20. НПФ — не заполняем
}

// X-границы всех 20 колонок Раздела III (центры линий бланка, субпиксельно).
// Точно совпадают со штампами => сетка строк не расходится с шапкой.
const COL_X = [
  23.51, 40.42, 127.38, 186.91, 223.75, 252.08, 288.95, 324.17, 358.20, 382.50,
  405.17, 444.83, 484.55, 524.00, 564.88, 606.43, 643.29, 701.84, 736.82, 779.04, 821.26,
]

// Геометрия (top-координаты, pt от верха страницы), измерено по бланку.
const SEC3_HEADER_TOP = 262.75 // верх блока «РАЗДЕЛ III» (шапка-штамп B)
const SEC3_ROWS_TOP   = 339.25 // строки сотрудников начинаются здесь (стр. 1)
const SEC4_TOP        = 372.0  // верх блока «РАЗДЕЛ IV» (штамп C)
const STAMP_A_H       = SEC3_ROWS_TOP            // 339.25 — Разделы I-II + шапка III
const STAMP_B_H       = SEC3_ROWS_TOP - SEC3_HEADER_TOP // 76.5 — только шапка III
const STAMP_C_H       = PAGE_H - SEC4_TOP        // 222.75 — Разделы IV-V + подвал
const CONT_ROWS_TOP   = STAMP_B_H                // строки на доп. страницах

const MIN_ROW_H   = 13.25 // высота строки как в бланке
const ROW_V_PAD   = 4     // вертикальный отступ при росте строки
const NAME_SIZE   = 6     // базовый кегль ФИО
const NUM_SIZE    = 7     // базовый кегль чисел
const PAD         = 2.5   // зазор от вертикальных линий колонки
const MIN_SIZE    = 4     // минимальный кегль
const NAME_MAX_LINES = 3  // максимум строк для ФИО
const BOTTOM_MARGIN  = 24 // нижнее поле страницы для строк

// Толщины линий и скругление — измерены по бланку
const FRAME_W   = 2.12 // жирная внешняя рамка бокса
const GRID_W    = 0.7  // тонкие внутренние линии
const CORNER_R  = 5.5  // радиус скругления углов бокса
const SEC4_GAP  = 5.3  // зазор от низа бокса III до начала Раздела IV

@Injectable()
export class Sti161OverlayService {
  async generatePdf(data: Sti161PdfInput): Promise<Buffer> {
    if (!fs.existsSync(TEMPLATE_PATH)) {
      throw new NotFoundException(
        'Бланк STI-161 не найден. Положите sti-161-blank.pdf в папку pdf/templates/',
      )
    }

    const [templateBytes, fontBytes] = [
      fs.readFileSync(TEMPLATE_PATH),
      fs.readFileSync(FONT_PATH),
    ]

    const blankDoc = await PDFDocument.load(templateBytes)
    const blankPage = blankDoc.getPages()[0]

    const out = await PDFDocument.create()
    out.registerFontkit(fontkit)
    const font = await out.embedFont(fontBytes)

    // Куски бланка как переиспользуемые «штампы» (clip по bounding-box).
    const stampA = await out.embedPage(blankPage, {
      left: 0, bottom: PAGE_H - STAMP_A_H, right: PAGE_W, top: PAGE_H,
    })
    const stampB = await out.embedPage(blankPage, {
      left: 0, bottom: PAGE_H - SEC3_ROWS_TOP, right: PAGE_W, top: PAGE_H - SEC3_HEADER_TOP,
    })
    const stampC = await out.embedPage(blankPage, {
      left: 0, bottom: 0, right: PAGE_W, top: STAMP_C_H,
    })

    // ---------- низкоуровневые помощники ----------
    // Тонкая линия по top-координатам
    const line = (pg: PDFPage, x1: number, t1: number, x2: number, t2: number, w = GRID_W) =>
      pg.drawLine({
        start: { x: x1, y: PAGE_H - t1 },
        end:   { x: x2, y: PAGE_H - t2 },
        thickness: w,
        color: rgb(0, 0, 0),
      })

    // Точки четверти окружности (PDF-координаты, y вверх)
    const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 8) => {
      const p: { x: number; y: number }[] = []
      for (let k = 0; k <= n; k++) {
        const a = a0 + ((a1 - a0) * k) / n
        p.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
      }
      return p
    }

    // Обводка ломаной со скруглёнными стыками
    const stroke = (pg: PDFPage, pts: { x: number; y: number }[], w: number) => {
      for (let k = 0; k < pts.length - 1; k++) {
        pg.drawLine({
          start: pts[k], end: pts[k + 1], thickness: w,
          color: rgb(0, 0, 0), lineCap: LineCapStyle.Round,
        })
      }
    }

    // Текст с выравниванием по левому краю (Раздел I, свободный текст)
    const draw = (
      pg: PDFPage, text: string | null | undefined, x: number, top: number, size = 7,
    ) => {
      const str = text == null || text === '' ? '—' : String(text)
      pg.drawText(str, { x, y: PAGE_H - top - size, size, font, color: rgb(0, 0, 0) })
    }

    // Один символ по центру клетки (cx — центр клетки, cy — центр по вертикали)
    const drawCharCenter = (pg: PDFPage, ch: string, cx: number, cy: number, size: number) => {
      const w = font.widthOfTextAtSize(ch, size)
      pg.drawText(ch, { x: cx - w / 2, y: PAGE_H - cy - size * 0.35, size, font, color: rgb(0, 0, 0) })
    }

    // Раскладка строки по равномерной гребёнке клеток (по одному символу в клетку)
    const combUniform = (
      pg: PDFPage, text: string | null | undefined,
      c: { x0: number; pitch: number; count: number; cy: number }, size = 8,
    ) => {
      const s = text == null ? '' : String(text)
      for (let i = 0; i < c.count && i < s.length; i++) {
        drawCharCenter(pg, s[i], c.x0 + c.pitch * (i + 0.5), c.cy, size)
      }
    }

    // Раскладка строки по явным центрам клеток (для дат)
    const combCenters = (
      pg: PDFPage, text: string, centers: number[], cy: number, size = 8,
    ) => {
      for (let i = 0; i < centers.length && i < text.length; i++) {
        drawCharCenter(pg, text[i], centers[i], cy, size)
      }
    }

    // Перенос строки по словам так, чтобы каждая влезала в maxW
    const wrapWords = (str: string, maxW: number, size: number): string[] => {
      const words = str.split(/\s+/).filter(Boolean)
      if (words.length === 0) return [str]
      const lines: string[] = []
      let cur = ''
      for (const word of words) {
        const candidate = cur ? `${cur} ${word}` : word
        if (font.widthOfTextAtSize(candidate, size) <= maxW || !cur) {
          cur = candidate
        } else {
          lines.push(cur)
          cur = word
        }
      }
      if (cur) lines.push(cur)
      return lines
    }

    // Обрезка с «…» под ширину maxW
    const ellipsize = (str: string, maxW: number, size: number): string => {
      if (font.widthOfTextAtSize(str, size) <= maxW) return str
      let s = str
      while (s.length > 1 && font.widthOfTextAtSize(`${s}…`, size) > maxW) {
        s = s.slice(0, -1)
      }
      return `${s}…`
    }

    // Подбор кегля и строк: текст должен уложиться в maxLines строк по ширине
    const fit = (
      raw: string, maxW: number, size: number, maxLines: number, wrap: boolean,
    ): { lines: string[]; size: number } => {
      let fontSize = size
      let lines: string[] = [raw]
      for (; fontSize >= MIN_SIZE; fontSize -= 0.5) {
        lines = wrap ? wrapWords(raw, maxW, fontSize) : [raw]
        const fits =
          lines.length <= maxLines &&
          lines.every((l) => font.widthOfTextAtSize(l, fontSize) <= maxW)
        if (fits) return { lines, size: fontSize }
      }
      fontSize = MIN_SIZE
      lines = wrap ? wrapWords(raw, maxW, fontSize) : [raw]
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines)
        lines[maxLines - 1] = ellipsize(`${lines[maxLines - 1]}…`, maxW, fontSize)
      }
      lines = lines.map((l) => ellipsize(l, maxW, fontSize))
      return { lines, size: fontSize }
    }

    // Рисует уже подготовленные строки по центру ячейки (гор. + верт.)
    const drawLines = (
      pg: PDFPage, lines: string[], col: { start: number; w: number },
      rowTop: number, rowH: number, size: number,
    ) => {
      const lineH = size * 1.12
      const blockH = lines.length * lineH
      const centerFromBottom = PAGE_H - (rowTop + rowH / 2)
      let baseline = centerFromBottom + blockH / 2 - lineH + size * 0.3
      for (const l of lines) {
        const tw = font.widthOfTextAtSize(l, size)
        const x = col.start + Math.max(PAD, (col.w - tw) / 2)
        pg.drawText(l, { x, y: baseline, size, font, color: rgb(0, 0, 0) })
        baseline -= lineH
      }
    }

    // Одно строковое значение по центру ячейки (числа/коды)
    const drawCell = (
      pg: PDFPage, text: string | null | undefined, col: { start: number; w: number },
      rowTop: number, rowH: number, size = NUM_SIZE,
    ) => {
      const raw = text == null || text === '' ? '—' : String(text)
      const { lines, size: fs2 } = fit(raw, col.w - PAD * 2, size, 1, false)
      drawLines(pg, lines, col, rowTop, rowH, fs2)
    }

    // Закрывает бокс Раздела III для набора строк на странице:
    //  - тонкие внутренние вертикали (0.7pt) и горизонтали между строк;
    //  - жирная внешняя рамка (2.12pt): боковые стороны + скруглённый низ
    //    с жирной нижней границей (углы радиусом CORNER_R).
    // Верх бокса (скруглённые верхние углы + шапка) даёт штамп.
    const drawGrid = (pg: PDFPage, tableTop: number, rows: { top: number; h: number }[]) => {
      if (rows.length === 0) return
      const tableBottom = rows[rows.length - 1].top + rows[rows.length - 1].h
      const yTop = PAGE_H - tableTop
      const yB = PAGE_H - tableBottom
      const Lx = COL_X[0]
      const Rx = COL_X[COL_X.length - 1]
      const R = CORNER_R

      // внутренние вертикали (тонкие)
      for (let i = 1; i < COL_X.length - 1; i++) {
        const x = COL_X[i]
        pg.drawLine({ start: { x, y: yTop }, end: { x, y: yB }, thickness: GRID_W, color: rgb(0, 0, 0) })
      }
      // верхняя граница строк (тонкая): рисуем сами, т.к. линия штампа на 339.25
      // лежит на краю обрезки и срезается клиппингом
      pg.drawLine({ start: { x: Lx, y: yTop }, end: { x: Rx, y: yTop }, thickness: GRID_W, color: rgb(0, 0, 0) })
      // горизонтали между строками (тонкие), кроме нижней — её даёт жирная граница
      for (let k = 0; k < rows.length - 1; k++) {
        const y = PAGE_H - (rows[k].top + rows[k].h)
        pg.drawLine({ start: { x: Lx, y }, end: { x: Rx, y }, thickness: GRID_W, color: rgb(0, 0, 0) })
      }
      // жирная рамка: левая сторона → скруглённый низ-лево → нижняя граница →
      // скруглённый низ-право → правая сторона
      stroke(pg, [
        { x: Lx, y: yTop },
        { x: Lx, y: yB + R },
        ...arc(Lx + R, yB + R, R, Math.PI, Math.PI * 1.5),
        ...arc(Rx - R, yB + R, R, Math.PI * 1.5, Math.PI * 2),
        { x: Rx, y: yB + R },
        { x: Rx, y: yTop },
      ], FRAME_W)
    }

    // ---------- сборка страниц ----------
    let page = out.addPage([PAGE_W, PAGE_H])
    page.drawPage(stampA, { x: 0, y: PAGE_H - STAMP_A_H, width: PAGE_W, height: STAMP_A_H })

    // Раздел I (только на первой странице)
    // Крестик типа документа — по центру выбранного чекбокса
    const dt = DOC_TYPE_COORDS[data.documentType]
    drawCharCenter(page, 'X', dt.cx, dt.cy, 9)
    // Свободный текст (наименования)
    draw(page, data.companyName,      F.NAME.x,     F.NAME.top, 6)
    draw(page, data.taxAuthorityName, F.TAX_NAME.x, F.TAX_NAME.top, 6)
    // Поля-гребёнки: цифры и номера по клеткам
    combUniform(page, data.taxId,               COMB.inn)
    combUniform(page, data.taxAuthorityCode,    COMB.taxCode)
    combUniform(page, data.okpoCode,            COMB.okpo)
    combUniform(page, data.socialFundRegNumber, COMB.reg)
    combUniform(page, data.highlandCoefficient ?? '1.0', COMB.koef)
    combUniform(page, data.socialTariffType,    COMB.tarif)
    combUniform(page, data.smz,                 COMB.smz)
    combUniform(page, data.usmz,                COMB.usmz)
    // Даты: только цифры (ДДММГГГГ) по клеткам
    const mm = String(data.periodMonth).padStart(2, '0')
    const yyyy = String(data.periodYear)
    const lastDay = String(new Date(data.periodYear, data.periodMonth, 0).getDate()).padStart(2, '0')
    combCenters(page, `01${mm}${yyyy}`,      DATE_FROM_CX, DATE_CY)
    combCenters(page, `${lastDay}${mm}${yyyy}`, DATE_TO_CX, DATE_CY)

    // Раздел III — строки сотрудников (динамически, с переносом на страницы)
    let tableTop = SEC3_ROWS_TOP
    let cursor = SEC3_ROWS_TOP
    let pageRows: { top: number; h: number }[] = []
    const rowLimit = PAGE_H - BOTTOM_MARGIN

    data.employees.forEach((emp, idx) => {
      const nameFit = fit(emp.fullName || '—', COLS.name.w - PAD * 2, NAME_SIZE, NAME_MAX_LINES, true)
      const rowH = Math.max(MIN_ROW_H, nameFit.lines.length * (nameFit.size * 1.12) + ROW_V_PAD)

      // Не помещается на текущей странице → новая страница с шапкой III
      if (cursor + rowH > rowLimit && pageRows.length > 0) {
        drawGrid(page, tableTop, pageRows)
        page = out.addPage([PAGE_W, PAGE_H])
        page.drawPage(stampB, { x: 0, y: PAGE_H - STAMP_B_H, width: PAGE_W, height: STAMP_B_H })
        tableTop = CONT_ROWS_TOP
        cursor = CONT_ROWS_TOP
        pageRows = []
      }

      const rowTop = cursor
      const workStartStr = emp.workStartDate
        ? [
            String(emp.workStartDate.getDate()).padStart(2, '0'),
            String(emp.workStartDate.getMonth() + 1).padStart(2, '0'),
            String(emp.workStartDate.getFullYear()).slice(2),
          ].join('.')
        : null

      drawCell(page, String(idx + 1),                   COLS.num,           rowTop, rowH)
      drawCell(page, emp.inn,                            COLS.inn,           rowTop, rowH)
      drawLines(page, nameFit.lines,                     COLS.name,          rowTop, rowH, nameFit.size)
      drawCell(page, '1',                                COLS.category,      rowTop, rowH)
      drawCell(page, emp.citizenship ?? 'КГ',            COLS.citizenship,   rowTop, rowH)
      drawCell(page, emp.isResident ? '1' : '0',        COLS.residency,     rowTop, rowH)
      drawCell(page, workStartStr,                       COLS.workStartDate, rowTop, rowH)
      drawCell(page, String(emp.daysWorked),             COLS.daysWorked,    rowTop, rowH)
      drawCell(page, '2000',                             COLS.incomeCode,    rowTop, rowH)
      drawCell(page, emp.totalIncome != null ? String(emp.totalIncome) : null, COLS.totalIncome, rowTop, rowH)
      drawCell(page, emp.incomeTax != null ? String(emp.incomeTax) : null,     COLS.taxTotal,    rowTop, rowH)
      drawCell(page, emp.socialContributions != null ? String(emp.socialContributions) : null, COLS.socialContr, rowTop, rowH)

      pageRows.push({ top: rowTop, h: rowH })
      cursor += rowH
    })
    drawGrid(page, tableTop, pageRows)

    // Разделы IV-V + подвал (штамп C): на текущей странице если влезает, иначе на новой
    let cTop: number
    if (cursor + SEC4_GAP + STAMP_C_H <= PAGE_H) {
      cTop = cursor + SEC4_GAP
    } else {
      page = out.addPage([PAGE_W, PAGE_H])
      cTop = BOTTOM_MARGIN
    }
    page.drawPage(stampC, { x: 0, y: PAGE_H - cTop - STAMP_C_H, width: PAGE_W, height: STAMP_C_H })

    const pdfBytes = await out.save()
    return Buffer.from(pdfBytes)
  }
}
