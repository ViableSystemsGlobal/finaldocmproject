# Pagination Migration Guide

## Issue: `itemsPerPage is undefined`

Multiple pages are using the old pagination API. Here's how to fix them:

## 1. Update Imports

**OLD:**
```tsx
import { Pagination } from '@/components/ui/pagination'
import { usePagination } from '@/hooks/usePagination'
```

**NEW:**
```tsx
import { Pagination, usePagination } from '@/components/ui/pagination'
```

## 2. Update Hook Usage

**OLD:**
```tsx
const pagination = usePagination(data, {
  initialPageSize: 25,
  totalItems: data.length
})
```

**NEW:**
```tsx
const pagination = usePagination(data, 25)
```

## 3. Update Data Access

**OLD:**
```tsx
pagination.paginatedData.map(item => ...)
pagination.paginatedData.length
```

**NEW:**
```tsx
pagination.currentItems.map(item => ...)
pagination.currentItems.length
```

## 4. Update Pagination Component

**OLD:**
```tsx
<Pagination
  currentPage={pagination.currentPage}
  totalPages={pagination.totalPages}
  onPageChange={pagination.setCurrentPage}
  showSizeChanger={true}
  pageSize={pagination.pageSize}
  onPageSizeChange={pagination.setPageSize}
  totalItems={pagination.totalItems}
/>
```

**NEW:**
```tsx
<Pagination
  currentPage={pagination.currentPage}
  totalPages={pagination.totalPages}
  totalItems={pagination.totalItems}
  itemsPerPage={pagination.itemsPerPage}
  onPageChange={pagination.handlePageChange}
  onItemsPerPageChange={pagination.handleItemsPerPageChange}
/>
```

## 5. Remove Old Reset Logic

**OLD:**
```tsx
useEffect(() => {
  pagination.goToFirstPage()
}, [searchQuery, filters])
```

**NEW:**
```tsx
// Remove this - pagination auto-resets when data changes
```

## Files That Need Updates:

- src/app/(admin)/settings/audit-logs/page.tsx
- src/app/(admin)/comms/campaigns/page.tsx
- src/app/(admin)/content/blogs/page.tsx
- src/app/(admin)/content/sermons/page.tsx
- src/app/(admin)/content/media/page.tsx
- src/app/(admin)/people/attendance/event/[id]/page.tsx
- src/app/(admin)/people/members/page.tsx ✅ FIXED
- src/app/(admin)/people/outreach/soul-winning/page.tsx
- src/app/(admin)/people/outreach/website-messages/page.tsx
- src/app/(admin)/people/outreach/follow-ups/page.tsx
- src/app/(admin)/people/outreach/prayer-requests/page.tsx
- src/app/(admin)/people/outreach/planned-visits/page.tsx
- src/components/content/MediaPicker.tsx

Apply these changes systematically to each file to fix the `itemsPerPage is undefined` errors. 