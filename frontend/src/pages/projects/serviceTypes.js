/** Service categories for new and existing projects (matches backend Project.ServiceType). */
export const PROJECT_SERVICE_TYPES = [
  { value: 'website_development', label: 'Website Development' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'branding', label: 'Branding' },
  { value: 'seo', label: 'SEO' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'software_development', label: 'Software Development' },
  { value: 'mobile_app', label: 'Mobile App' },
  { value: 'other', label: 'Other' },
]

export function serviceTypeLabel(value) {
  return PROJECT_SERVICE_TYPES.find((option) => option.value === value)?.label || value || '—'
}
