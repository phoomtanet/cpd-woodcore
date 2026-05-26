'use client'

import { unstableSetRender, ConfigProvider } from 'antd'
import { createRoot } from 'react-dom/client'
import thTH from 'antd/locale/th_TH'

if (typeof window !== 'undefined') {
  unstableSetRender((node, container) => {
    const root = createRoot(container!)
    root.render(node)
    return async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
      root.unmount()
    }
  })
}

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={thTH}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
