import { useState } from 'react'

import FilterDrawer from './FilterDrawer.jsx'
import PageSizeSelect from './PageSizeSelect.jsx'
import PrintButton from './PrintButton.jsx'
import SearchInput from './SearchInput.jsx'
import StatusTabs from './StatusTabs.jsx'
import { ChevronLeftIcon, ChevronRightIcon, ExportIcon, FilterIcon, PlusIcon } from './Icons.jsx'
import { tabsWithCount } from '../utils/listToolbar.js'

function ToolbarPagination({ page, count, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize))
  const first = count ? (page - 1) * pageSize + 1 : 0
  const last = count ? Math.min(page * pageSize, count) : 0

  return (
    <div className="flex items-center gap-1 text-sm text-slate-600">
      <button
        type="button"
        className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-50
          disabled:cursor-not-allowed disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <span className="flex items-center gap-0.5">
          <ChevronLeftIcon className="h-3.5 w-3.5" />
          Prev
        </span>
      </button>
      <span className="whitespace-nowrap px-1 tabular-nums">
        {first}-{last} of {count}
      </span>
      <button
        type="button"
        className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-50
          disabled:cursor-not-allowed disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <span className="flex items-center gap-0.5">
          Next
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </span>
      </button>
    </div>
  )
}

/**
 * Two-row list header: status tabs, then bulk/show/pagination/search/actions.
 * Matches the layout used across module list screens.
 */
export default function ListScreenToolbar({
  statusTabs,
  status,
  onStatusChange,
  count,
  search,
  onSearchChange,
  searchPlaceholder = 'Search',
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  filterContent,
  onExport,
  addLabel = 'Add New',
  onAdd,
  showAdd = true,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const tabOptions = tabsWithCount(statusTabs, status, count)

  return (
    <div className="no-print list-screen-toolbar border-b border-slate-200">
      <StatusTabs options={tabOptions} value={status} onChange={onStatusChange} />

      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          className="btn-secondary cursor-not-allowed py-1.5 text-sm text-slate-400 opacity-70"
          disabled
          aria-label="Bulk actions"
        >
          Bulk actions
        </button>

        <PageSizeSelect value={pageSize} onChange={onPageSizeChange} />

        <ToolbarPagination
          page={page}
          count={count}
          pageSize={pageSize}
          onChange={onPageChange}
        />

        <div className="min-w-[160px] flex-1 sm:min-w-[220px]">
          <SearchInput value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          {onExport ? (
            <button type="button" className="btn-secondary py-1.5 text-sm" onClick={onExport}>
              <ExportIcon className="h-4 w-4" />
              Export
            </button>
          ) : null}

          <PrintButton label="Print" className="py-1.5 text-sm" />

          {filterContent ? (
            <button
              type="button"
              className={`btn-secondary py-1.5 text-sm ${filtersOpen ? 'border-brand-500 text-brand-700' : ''}`}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <FilterIcon className="h-4 w-4" />
              Filter
            </button>
          ) : null}

          {showAdd && onAdd ? (
            <button type="button" className="btn-primary py-1.5 text-sm" onClick={onAdd}>
              <PlusIcon className="h-4 w-4" />
              {addLabel}
            </button>
          ) : null}
        </div>
      </div>

      {filterContent ? (
        <FilterDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)}>
          {filterContent}
        </FilterDrawer>
      ) : null}
    </div>
  )
}
