import { useEffect, useState } from 'react'
import type { SavedOrder } from '../types/food'

const STORAGE_KEY = 'wasteland-orders'
const MAX_ORDERS = 30

function loadOrders(): SavedOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? (parsed as SavedOrder[]) : []
  } catch {
    return []
  }
}

/** Reservations made on this device, newest first. They never leave the browser. */
export function useOrders() {
  const [orders, setOrders] = useState<SavedOrder[]>(loadOrders)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    } catch {
      // localStorage unavailable — orders last for this session only
    }
  }, [orders])

  function addOrder(order: SavedOrder) {
    setOrders((prev) => [order, ...prev].slice(0, MAX_ORDERS))
  }

  function clearOrders() {
    setOrders([])
  }

  return { orders, addOrder, clearOrders }
}
