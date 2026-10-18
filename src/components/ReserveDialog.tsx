import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { fill } from '../i18n/translations'
import type { Offer, Reservation } from '../types/food'
import { reserve } from '../utils/foodApi'
import { formatMoney, formatNumber } from '../utils/format'
import { Emblem } from './Emblem'

const MAX_UNITS = 4

interface ReserveDialogProps {
  offer: Offer
  onClose: () => void
  onReserved: (reservation: Reservation) => void
}

type Phase = { step: 'choose'; error?: string } | { step: 'sending' } | { step: 'done'; reservation: Reservation }

/** Choose portions → the server confirms and returns a pickup code. Payment happens at the counter. */
export function ReserveDialog({ offer, onClose, onReserved }: ReserveDialogProps) {
  const { t, lang } = useLanguage()
  const [quantity, setQuantity] = useState(1)
  const [phase, setPhase] = useState<Phase>({ step: 'choose' })
  const dialogRef = useRef<HTMLDivElement>(null)
  const maxUnits = Math.max(1, Math.min(MAX_UNITS, offer.quantityLeft))
  const money = (value: number) => formatMoney(value, offer.currency, lang)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [onClose])

  async function confirm() {
    setPhase({ step: 'sending' })
    const result = await reserve(offer.id, quantity)
    if (result.ok) {
      setPhase({ step: 'done', reservation: result.data })
      onReserved(result.data)
      return
    }
    const message =
      result.reason === 'soldOut' ? t.reserveDialog.errorSoldOut : result.reason === 'expired' ? t.reserveDialog.errorExpired : t.reserveDialog.errorGeneric
    setPhase({ step: 'choose', error: message })
  }

  const total = offer.price * quantity
  const saved = (offer.originalPrice - offer.price) * quantity

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[var(--bg-dark)]/70 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserve-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92svh] w-full max-w-lg overflow-y-auto bg-[var(--bg)] px-7 pb-8 pt-10 shadow-2xl outline-none animate-[fadeIn_0.35s_ease-out] sm:px-10"
      >
        <button type="button" onClick={onClose} className="eyebrow absolute right-5 top-5 text-[var(--text-soft)] hover:text-[var(--text)]">
          {t.reserveDialog.close}
        </button>

        {phase.step === 'done' ? (
          <div className="text-center">
            <Emblem className="mx-auto h-14 w-14 text-[var(--accent)]" />
            <p className="eyebrow mt-5 text-[var(--accent)]">{t.reserveDialog.successEyebrow}</p>
            <h2 id="reserve-title" className="font-display mt-2 text-4xl text-[var(--text)]">
              {fill(t.reserveDialog.successTitle, { until: phase.reservation.pickupUntil })}
            </h2>
            <p className="mt-3 text-sm text-[var(--text-muted)]">{fill(t.reserveDialog.successText, { venue: phase.reservation.venueName })}</p>

            <div className="mx-auto mt-8 max-w-xs border border-[var(--gold)] px-6 py-5">
              <p className="eyebrow text-[0.6rem] text-[var(--text-soft)]">{t.reserveDialog.codeLabel}</p>
              <p className="font-display mt-1 text-4xl tracking-[0.12em] text-[var(--cocoa)]">{phase.reservation.code}</p>
            </div>

            <dl className="mx-auto mt-6 grid max-w-xs grid-cols-2 gap-3 text-left text-sm">
              <dt className="text-[var(--text-soft)]">{t.reserveDialog.total}</dt>
              <dd className="text-right text-[var(--text)]">{money(phase.reservation.total)}</dd>
              <dt className="text-[var(--text-soft)]">{t.reserveDialog.youSave}</dt>
              <dd className="text-right text-[var(--text)]">{money(phase.reservation.originalTotal - phase.reservation.total)}</dd>
            </dl>

            <button type="button" onClick={onClose} className="btn-lux btn-solid mt-8 w-full">
              {t.reserveDialog.done}
            </button>
          </div>
        ) : (
          <>
            <p className="eyebrow text-[var(--accent)]">{t.reserveDialog.title}</p>
            <h2 id="reserve-title" className="font-display mt-2 text-4xl leading-tight text-[var(--text)]">
              {t.items[offer.item]}
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {fill(t.reserveDialog.pickupAt, { venue: offer.venueName, from: offer.pickupFrom, until: offer.pickupUntil })}
            </p>

            <div className="mt-8 flex items-center justify-between border-y border-[var(--border)] py-5">
              <span className="eyebrow text-[var(--text-muted)]">{t.reserveDialog.quantity}</span>
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  aria-label="−"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="h-10 w-10 rounded-full border border-[var(--gold)] text-lg text-[var(--cocoa)] disabled:opacity-30"
                >
                  −
                </button>
                <span className="font-display w-6 text-center text-3xl tabular-nums" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="+"
                  onClick={() => setQuantity((q) => Math.min(maxUnits, q + 1))}
                  disabled={quantity >= maxUnits}
                  className="h-10 w-10 rounded-full border border-[var(--gold)] text-lg text-[var(--cocoa)] disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">{t.reserveDialog.unitPrice}</dt>
                <dd>
                  <span className="mr-2 text-[var(--text-soft)] line-through">{money(offer.originalPrice)}</span>
                  {money(offer.price)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">{t.reserveDialog.youSave}</dt>
                <dd>{money(saved)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">{t.reserveDialog.youRescue}</dt>
                <dd>{formatNumber(offer.kgPerPortion * quantity, lang, 2)} kg</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-4">
                <dt className="eyebrow text-[var(--text)]">{t.reserveDialog.total}</dt>
                <dd className="font-display text-3xl text-[var(--cocoa)]">{money(total)}</dd>
              </div>
            </dl>

            {phase.step === 'choose' && phase.error && (
              <p role="alert" className="mt-5 border-l-2 border-[#a4452c] pl-3 text-sm text-[#a4452c]">
                {phase.error}
              </p>
            )}

            <button type="button" onClick={confirm} disabled={phase.step === 'sending'} className="btn-lux btn-solid mt-8 w-full">
              {phase.step === 'sending' ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                  {t.reserveDialog.confirming}
                </>
              ) : (
                t.reserveDialog.confirm
              )}
            </button>
            <p className="mt-4 text-center text-xs text-[var(--text-soft)]">{t.reserveDialog.payNote}</p>
          </>
        )}
      </div>
    </div>
  )
}
