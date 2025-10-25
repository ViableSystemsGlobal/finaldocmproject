# Pagination Implementation Guide

This document explains how pagination has been implemented across all table pages in the admin application.

## Overview

We've implemented a consistent pagination system using:
- A reusable `Pagination` component (`apps/admin/src/components/ui/pagination.tsx`)
- A custom `usePagination` hook (`apps/admin/src/hooks/usePagination.ts`)

## Components

### Pagination Component

The `Pagination` component provides:
- Page navigation with previous/next buttons
- Page number buttons with ellipsis for large page counts
- Optional page size selector
- Item count display
- Responsive design

**Props:**
- `currentPage`: Current active page number
- `totalPages`: Total number of pages
- `onPageChange`: Function to handle page changes
- `showSizeChanger`: Whether to show page size selector (optional)
- `pageSize`: Current page size (optional)
- `onPageSizeChange`: Function to handle page size changes (optional)
- `totalItems`: Total number of items (optional)

### usePagination Hook

The `usePagination` hook manages pagination state and logic:

**Parameters:**
- `data`: Array of items to paginate
- `options`: Configuration object with `initialPage`, `initialPageSize`, and `totalItems`

**Returns:**
- `currentPage`: Current page number
- `pageSize`: Items per page
- `totalPages`: Total number of pages
- `totalItems`: Total number of items
- `paginatedData`: Current page's data slice
- `setCurrentPage`: Function to change page
- `setPageSize`: Function to change page size
- `goToFirstPage`: Function to go to first page
- `goToLastPage`: Function to go to last page
- `hasNextPage`: Boolean indicating if next page exists
- `hasPreviousPage`: Boolean indicating if previous page exists
- `reset`: Function to reset to first page with initial page size

## Implementation Steps

### 1. Import Required Components

```typescript
import { Pagination } from '@/components/ui/pagination'
import { usePagination } from '@/hooks/usePagination'
```

### 2. Set Up Pagination Hook

```typescript
const pagination = usePagination(filteredData, {
  initialPageSize: 25, // or your preferred default
  totalItems: filteredData.length
})
```

### 3. Update Table to Use Paginated Data

Replace your data array with `pagination.paginatedData`:

```typescript
// Before
{data.map((item) => (
  <TableRow key={item.id}>
    {/* table content */}
  </TableRow>
))}

// After
{pagination.paginatedData.map((item) => (
  <TableRow key={item.id}>
    {/* table content */}
  </TableRow>
))}
```

### 4. Add Pagination Component

Add the pagination component after your table:

```typescript
{/* Pagination */}
{filteredData.length > 0 && (
  <Pagination
    currentPage={pagination.currentPage}
    totalPages={pagination.totalPages}
    onPageChange={pagination.setCurrentPage}
    showSizeChanger={true}
    pageSize={pagination.pageSize}
    onPageSizeChange={pagination.setPageSize}
    totalItems={pagination.totalItems}
  />
)}
```

### 5. Handle Filter Changes (Optional)

If your page has filters, reset pagination when filters change:

```typescript
useEffect(() => {
  pagination.goToFirstPage()
}, [searchQuery, statusFilter, categoryFilter])
```

## Implemented Pages

The following pages have been updated with pagination:

### ✅ Completed
- **Contacts** (`/people/contacts`) - 25 items per page
- **Members** (`/people/members`) - 25 items per page  
- **Audit Logs** (`/settings/audit-logs`) - 50 items per page
- **Campaigns** (`/comms/campaigns`) - 20 items per page

### 🔄 Recommended for Implementation
- **Visitors** (`/people/visitors`)
- **Groups** (`/people/groups`)
- **Giving Records** (`/finance/giving`)
- **Expenses** (`/finance/expenses`)
- **Events** (`/events`)
- **Prayer Requests** (`/people/outreach/prayer-requests`)
- **Follow-ups** (`/people/outreach/follow-ups`)
- **Soul Winning** (`/people/outreach/soul-winning`)
- **Discipleship Groups** (`/people/discipleship`)
- **Transport Drivers** (`/people/transport/drivers`)
- **Content Pages** (`/content`)
- **Settings Pages** (Roles, Navigation, Campuses)

## Best Practices

1. **Consistent Page Sizes**: Use appropriate default page sizes:
   - Small datasets (< 100 items): 10-25 per page
   - Medium datasets (100-1000 items): 25-50 per page
   - Large datasets (> 1000 items): 50-100 per page

2. **Show Size Changer**: Always enable `showSizeChanger` for better UX

3. **Filter Integration**: Reset to first page when filters change

4. **Loading States**: Show pagination only when data is loaded and not empty

5. **Responsive Design**: The pagination component is already responsive

## Example Implementation

Here's a complete example from the contacts page:

```typescript
export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const pagination = usePagination(contacts, {
    initialPageSize: 25,
    totalItems: contacts.length
  })

  // ... data loading logic

  return (
    <div>
      {/* Table */}
      <Table>
        <TableHeader>
          {/* headers */}
        </TableHeader>
        <TableBody>
          {pagination.paginatedData.map((contact) => (
            <TableRow key={contact.id}>
              {/* table content */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      {contacts.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setCurrentPage}
          showSizeChanger={true}
          pageSize={pagination.pageSize}
          onPageSizeChange={pagination.setPageSize}
          totalItems={pagination.totalItems}
        />
      )}
    </div>
  )
}
```

## Benefits

- **Performance**: Only renders visible items
- **User Experience**: Easy navigation through large datasets
- **Consistency**: Uniform pagination across all pages
- **Flexibility**: Configurable page sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Responsive**: Works on all screen sizes

## Future Enhancements

- Server-side pagination for very large datasets
- URL-based pagination state persistence
- Infinite scroll option for mobile
- Keyboard shortcuts for navigation 