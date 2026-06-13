import ExcelJS from 'exceljs'
import type { ReportService } from './report.service'

type BalanceResult = Awaited<ReturnType<typeof ReportService.getBalance>>
type MovementResult = Awaited<ReturnType<typeof ReportService.getMovement>>

const TX_TYPE_LABEL: Record<string, string> = {
  in: 'รับเข้า',
  out: 'เบิกออก',
  adjust: 'ปรับสต๊อก',
  transfer: 'โอนย้าย',
}

// UTF-8 BOM so Thai text opens correctly in Excel / Express accounting import.
const BOM = '﻿'

type BinRef = { code: string; name?: string | null } | null

// Format a transaction's bin location: "A-01" or "A-01 -> A-02" for transfers.
function formatBin(bin: BinRef, tobin: BinRef, arrow: string): string {
  if (!bin && !tobin) return ''
  const from = bin?.code ?? ''
  if (tobin) return `${from}${arrow}${tobin.code}`
  return from
}

type CsvValue = string | number | null | undefined

function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Quote when the field contains a comma, double-quote, or newline.
  if (/[",\r\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

function toCsv(rows: CsvValue[][]): string {
  return BOM + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true }
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6E6' } }
    cell.border = { bottom: { style: 'thin' } }
  })
}

export const ExportService = {
  async balanceToXlsx(result: BalanceResult): Promise<Buffer> {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Stock Balance')

    ws.columns = [
      { header: 'ลำดับ', key: 'index', width: 8 },
      { header: 'SKU', key: 'sku', width: 16 },
      { header: 'ชื่อสินค้า', key: 'name', width: 28 },
      { header: 'ประเภท', key: 'productType', width: 12 },
      { header: 'หมวดหมู่', key: 'category', width: 16 },
      { header: 'หน่วย', key: 'unit', width: 10 },
      { header: 'คงเหลือ', key: 'quantity', width: 12 },
      { header: 'ราคาทุน', key: 'costPrice', width: 12 },
      { header: 'มูลค่าทุน', key: 'costValue', width: 14 },
      { header: 'ราคาขาย', key: 'salePrice', width: 12 },
      { header: 'มูลค่าขาย', key: 'saleValue', width: 14 },
    ]
    styleHeader(ws.getRow(1))

    result.items.forEach((item, i) => {
      ws.addRow({
        index: i + 1,
        sku: item.sku,
        name: item.name,
        productType: item.productType,
        category: item.category ?? '-',
        unit: item.unit,
        quantity: item.quantity,
        costPrice: item.costPrice,
        costValue: item.costValue,
        salePrice: item.salePrice,
        saleValue: item.saleValue,
      })
    })

    const totalRow = ws.addRow({
      name: 'รวม',
      quantity: result.summary.totalQuantity,
      costValue: result.summary.totalCostValue,
      saleValue: result.summary.totalSaleValue,
    })
    totalRow.font = { bold: true }

    const numberFormat = '#,##0.00'
    ;['costPrice', 'costValue', 'salePrice', 'saleValue'].forEach((key) => {
      ws.getColumn(key).numFmt = numberFormat
    })
    ws.getColumn('quantity').numFmt = '#,##0'

    const buffer = await wb.xlsx.writeBuffer()
    return Buffer.from(buffer)
  },

  balanceToCsv(result: BalanceResult): string {
    const rows: CsvValue[][] = [
      [
        'ลำดับ',
        'SKU',
        'ชื่อสินค้า',
        'ประเภท',
        'หมวดหมู่',
        'หน่วย',
        'คงเหลือ',
        'ราคาทุน',
        'มูลค่าทุน',
        'ราคาขาย',
        'มูลค่าขาย',
      ],
    ]
    result.items.forEach((item, i) => {
      rows.push([
        i + 1,
        item.sku,
        item.name,
        item.productType,
        item.category ?? '',
        item.unit,
        item.quantity,
        item.costPrice,
        item.costValue,
        item.salePrice,
        item.saleValue,
      ])
    })
    rows.push([
      '',
      '',
      'รวม',
      '',
      '',
      '',
      result.summary.totalQuantity,
      '',
      result.summary.totalCostValue,
      '',
      result.summary.totalSaleValue,
    ])
    return toCsv(rows)
  },

  async movementToXlsx(result: MovementResult): Promise<Buffer> {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Stock Movement')

    ws.columns = [
      { header: 'ลำดับ', key: 'index', width: 8 },
      { header: 'วันที่', key: 'date', width: 20 },
      { header: 'ประเภท', key: 'type', width: 12 },
      { header: 'SKU', key: 'sku', width: 16 },
      { header: 'ชื่อสินค้า', key: 'name', width: 28 },
      { header: 'จำนวน', key: 'quantity', width: 12 },
      { header: 'หน่วย', key: 'unit', width: 10 },
      { header: 'คลัง', key: 'warehouse', width: 16 },
      { header: 'Bin', key: 'bin', width: 14 },
      { header: 'ผู้บันทึก', key: 'createdBy', width: 16 },
      { header: 'หมายเหตุ', key: 'note', width: 24 },
    ]
    styleHeader(ws.getRow(1))

    result.items.forEach((tx, i) => {
      const toWh = tx.toWarehouse ? ` → ${tx.toWarehouse.name}` : ''
      ws.addRow({
        index: i + 1,
        date: new Date(tx.createdAt).toISOString(),
        type: TX_TYPE_LABEL[tx.type] ?? tx.type,
        sku: tx.product.sku,
        name: tx.product.name,
        quantity: tx.quantity,
        unit: tx.product.unit,
        warehouse: tx.warehouse ? `${tx.warehouse.name}${toWh}` : '-',
        bin: formatBin(tx.bin, tx.tobin, ' → ') || '-',
        createdBy: tx.createdBy?.name ?? '-',
        note: tx.note ?? '',
      })
    })

    const totalRow = ws.addRow({
      name: 'รวม (รับเข้า/เบิกออก)',
      quantity: `+${result.summary.totalIn} / -${result.summary.totalOut}`,
    })
    totalRow.font = { bold: true }

    ws.getColumn('quantity').numFmt = '#,##0'

    const buffer = await wb.xlsx.writeBuffer()
    return Buffer.from(buffer)
  },

  movementToCsv(result: MovementResult): string {
    const rows: CsvValue[][] = [
      [
        'ลำดับ',
        'วันที่',
        'ประเภท',
        'SKU',
        'ชื่อสินค้า',
        'จำนวน',
        'หน่วย',
        'คลัง',
        'Bin',
        'ผู้บันทึก',
        'หมายเหตุ',
      ],
    ]
    result.items.forEach((tx, i) => {
      const toWh = tx.toWarehouse ? ` -> ${tx.toWarehouse.name}` : ''
      rows.push([
        i + 1,
        new Date(tx.createdAt).toISOString(),
        TX_TYPE_LABEL[tx.type] ?? tx.type,
        tx.product.sku,
        tx.product.name,
        tx.quantity,
        tx.product.unit,
        tx.warehouse ? `${tx.warehouse.name}${toWh}` : '',
        formatBin(tx.bin, tx.tobin, ' -> '),
        tx.createdBy?.name ?? '',
        tx.note ?? '',
      ])
    })
    return toCsv(rows)
  },
}
