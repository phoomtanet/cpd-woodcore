import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CPD Woodcore — ระบบสต๊อกสินค้า',
  description: 'ระบบจัดการสต๊อกสินค้า บริษัท ซีพีดี ซอว์มิลล์ จำกัด',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
