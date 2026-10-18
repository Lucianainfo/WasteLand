import { useLanguage } from '../i18n/LanguageContext'

interface SearchBarProps {
  city: string
  onCityChange: (city: string) => void
  onSearch: () => void
  loading: boolean
}

/** A single underlined field and a pill button, like the hotel's booking form. */
export function SearchBar({ city, onCityChange, onSearch, loading }: SearchBarProps) {
  const { t } = useLanguage()
  return (
    <form
      className="mx-auto flex max-w-2xl flex-col items-stretch gap-6 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault()
        onSearch()
      }}
    >
      <label className="flex-1">
        <span className="eyebrow text-[var(--accent)]">{t.home.searchLabel}</span>
        <input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder={t.home.searchPlaceholder}
          className="field-line font-display !text-2xl"
          autoComplete="address-level2"
        />
      </label>
      <button type="submit" disabled={loading || !city.trim()} className="btn-lux btn-solid min-w-40">
        {loading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
            {t.home.searching}
          </>
        ) : (
          t.home.searchButton
        )}
      </button>
    </form>
  )
}
