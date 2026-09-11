/**
 * Small inline icon set. Keeping these local avoids pulling in an icon
 * package for the handful of glyphs the interface needs.
 */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ children, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      {children}
    </svg>
  )
}

export const DashboardIcon = (props) => (
  <Svg {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </Svg>
)

export const ClientsIcon = (props) => (
  <Svg {...props}>
    <path d="M3 21V7l6-4 6 4v14" />
    <path d="M15 21V11h6v10" />
    <path d="M7 10h2M7 14h2M18 15h1" />
  </Svg>
)

export const ProjectsIcon = (props) => (
  <Svg {...props}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </Svg>
)

export const TasksIcon = (props) => (
  <Svg {...props}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="m3 6 1.5 1.5L7 5" />
    <path d="m3 12 1.5 1.5L7 11" />
    <path d="M3.5 17.5h2" />
  </Svg>
)

export const InvoiceIcon = (props) => (
  <Svg {...props}>
    <path d="M6 2h9l4 4v16l-3-2-3 2-3-2-3 2Z" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </Svg>
)

export const PaymentIcon = (props) => (
  <Svg {...props}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M2 11h20" />
    <path d="M6 15h3" />
  </Svg>
)

export const TeamIcon = (props) => (
  <Svg {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 5.5a3 3 0 0 1 0 5.6" />
    <path d="M17.5 20a6 6 0 0 0-2-4.5" />
  </Svg>
)

export const ReportsIcon = (props) => (
  <Svg {...props}>
    <path d="M4 20h16" />
    <path d="M7 20v-6M12 20V8M17 20v-9" />
  </Svg>
)

export const SettingsIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 2.6 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.7-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.6a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21.4 11a2 2 0 1 1 0 4Z" />
  </Svg>
)

export const LogoutIcon = (props) => (
  <Svg {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Svg>
)

export const PlusIcon = (props) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const SearchIcon = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
)

export const EditIcon = (props) => (
  <Svg {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Svg>
)

export const TrashIcon = (props) => (
  <Svg {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
)

export const CloseIcon = (props) => (
  <Svg {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
)

export const ChevronLeftIcon = (props) => (
  <Svg {...props}>
    <path d="m15 18-6-6 6-6" />
  </Svg>
)

export const ChevronRightIcon = (props) => (
  <Svg {...props}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
)

export const MenuIcon = (props) => (
  <Svg {...props}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
)

export const AlertIcon = (props) => (
  <Svg {...props}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
)

export const CheckIcon = (props) => (
  <Svg {...props}>
    <path d="m20 6-11 11-5-5" />
  </Svg>
)

export const PrinterIcon = (props) => (
  <Svg {...props}>
    <path d="M6 9V3h12v6" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
    <path d="M6 14h12v7H6Z" />
  </Svg>
)

export const FilterIcon = (props) => (
  <Svg {...props}>
    <path d="M4 5h16M7 12h10M10 19h4" />
  </Svg>
)

export const ExportIcon = (props) => (
  <Svg {...props}>
    <path d="M12 3v12M7 8l5-5 5 5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Svg>
)

export const PanelLeftIcon = (props) => (
  <Svg {...props}>
    <path d="M9 3H4v18h5V3Z" />
    <path d="M9 3h11v18H9" />
  </Svg>
)

export const SunIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Svg>
)

export const MoonIcon = (props) => (
  <Svg {...props}>
    <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z" />
  </Svg>
)

export const SendIcon = (props) => (
  <Svg {...props}>
    <path d="M22 2 11 13" />
    <path d="M22 2l-7 20-4-9-9-4Z" />
  </Svg>
)

export const EyeIcon = (props) => (
  <Svg {...props}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
)

export const EyeOffIcon = (props) => (
  <Svg {...props}>
    <path d="M3 3l18 18" />
    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
    <path d="M9.9 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.2 18.2 0 0 1-4.1 5.2" />
    <path d="M6.1 6.1A18.5 18.5 0 0 0 2 12s3.5 7 10 7a10.2 10.2 0 0 0 4.9-1.2" />
  </Svg>
)

export const ViewIcon = (props) => (
  <Svg {...props}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
)
