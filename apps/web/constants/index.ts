export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  PRODUCTS: '/products',
  STOCK_IN: '/stock-in',
  STOCK_OUT: '/stock-out',
  STOCK_ADJUST: '/stock-adjust',
  STOCK_TRANSFER: '/stock-transfer',
  STOCK_CARD: '/stock-card',
  ALERTS: '/alerts',
  REPORTS: '/reports',
  USERS: '/users',
  SETTINGS_ROLES: '/settings/roles',
  SETTINGS_MASTER_TYPES: '/settings/master',
  SETTINGS_MASTER_UNITS: '/settings/master/units',
  SETTINGS_MASTER_CATEGORIES: '/settings/master/categories',
} as const

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'
