# Beautiful Pagination Component - Usage Guide

Your beautiful pagination UI is now standardized and ready to use across your entire application! Here's how to implement it on any page with a data table.

## 1. Import the Components

```tsx
import { Pagination, usePagination } from '@/components/ui/pagination'
```

## 2. Basic Implementation

```tsx
function MyDataPage() {
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  
  // Use the pagination hook
  const pagination = usePagination(filteredData, 10) // 10 items per page initially
  
  return (
    <div>
      {/* Your table with pagination.currentItems */}
      <Table>
        <TableBody>
          {pagination.currentItems.map(item => (
            <TableRow key={item.id}>
              {/* Your table cells */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Beautiful pagination component */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={pagination.handlePageChange}
        onItemsPerPageChange={pagination.handleItemsPerPageChange}
        className="mt-6"
      />
    </div>
  )
}
```

## 3. Advanced Implementation with Search/Filters

```tsx
function AdvancedDataPage() {
  const [allData, setAllData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter data based on search
  useEffect(() => {
    const filtered = allData.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredData(filtered)
  }, [allData, searchTerm])
  
  // Use pagination hook with filtered data
  const pagination = usePagination(filteredData, 25)
  
  return (
    <div>
      {/* Search input */}
      <Input
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {/* Results summary */}
      <div className="text-sm text-slate-600 mb-4">
        {searchTerm ? `Found ${filteredData.length} results` : `${allData.length} total items`}
      </div>
      
      {/* Your table */}
      <Table>
        <TableBody>
          {pagination.currentItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No results found</h3>
                    <p className="text-slate-600">
                      {searchTerm ? 'Try adjusting your search terms.' : 'No data available.'}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            pagination.currentItems.map(item => (
              <TableRow key={item.id}>
                {/* Your table cells */}
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.email}</TableCell>
                {/* ... more cells */}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Beautiful pagination with keyboard navigation */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={pagination.handlePageChange}
        onItemsPerPageChange={pagination.handleItemsPerPageChange}
        className="mt-6"
      />
    </div>
  )
}
```

## 4. Customization Options

The pagination component supports various customization options:

```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={handlePageChange}
  onItemsPerPageChange={handleItemsPerPageChange}
  
  // Customization options
  itemsPerPageOptions={[5, 10, 25, 50, 100]}  // Default: [5, 10, 25, 50, 100]
  showItemsPerPage={true}                      // Default: true
  showPageInfo={true}                          // Default: true
  showFirstLast={true}                         // Default: true
  className="mt-6"                             // Custom styling
/>
```

## 5. Hook-only Implementation (Manual Control)

If you need more control, you can use just the `usePagination` hook:

```tsx
function ManualPaginationPage() {
  const [data, setData] = useState([])
  const pagination = usePagination(data, 20)
  
  // You can access all these values:
  // pagination.currentPage
  // pagination.totalPages
  // pagination.itemsPerPage
  // pagination.currentItems
  // pagination.totalItems
  // pagination.handlePageChange
  // pagination.handleItemsPerPageChange
  // pagination.setCurrentPage
  // pagination.setItemsPerPage
  
  return (
    <div>
      {/* Build your own pagination UI */}
      <div className="flex justify-between items-center">
        <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
        <div className="space-x-2">
          <Button 
            onClick={() => pagination.handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            Previous
          </Button>
          <Button 
            onClick={() => pagination.handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
```

## 6. Pages Perfect for This Pagination

Here are the pages in your app that would benefit from this beautiful pagination:

### Currently Implemented ✅
- **Finance → Giving** - Already using the beautiful pagination
- **People → Contacts** - Already has pagination (can be upgraded)

### Ready for Implementation 🎯
- **People → Mobile App Users** - Long user lists
- **People → Outreach → Follow-ups** - Large datasets
- **People → Outreach → Prayer Requests** - Many requests
- **People → Outreach → Soul Winning** - Contact lists
- **People → Transport Requests** - Request management
- **People → Visitors** - Visitor tracking
- **Reports** - Any report with tabular data
- **Events → Attendance** - Event attendance lists
- **Communication → Campaigns** - Campaign history
- **Media Library** - File listings

## 7. Features Included

✨ **What makes this pagination beautiful:**

- **Responsive Design** - Works perfectly on mobile and desktop
- **Modern Glass Effect** - Beautiful backdrop blur and translucency
- **Smart Page Numbering** - Shows relevant page numbers intelligently
- **Configurable Items Per Page** - 5, 10, 25, 50, 100 options
- **Comprehensive Info Display** - "Showing X-Y of Z items • Page N of M"
- **Keyboard Navigation** - Arrow keys work when not typing
- **Smooth Transitions** - Elegant hover effects
- **Empty State Handling** - Graceful handling of no results
- **Auto-reset on Filter** - Pagination resets when data changes

This pagination component will give your entire application a consistent, professional, and delightful user experience! 🚀 