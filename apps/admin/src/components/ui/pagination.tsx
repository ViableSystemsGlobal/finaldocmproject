'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  itemsPerPageOptions?: number[]
  showItemsPerPage?: boolean
  showPageInfo?: boolean
  showFirstLast?: boolean
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 25, 50, 100],
  showItemsPerPage = true,
  showPageInfo = true,
  showFirstLast = true,
  className = ''
}: PaginationProps) {
  const goToPage = (page: number) => {
    onPageChange(Math.max(1, Math.min(page, totalPages)))
  }

  const goToPrevious = () => {
    onPageChange(Math.max(1, currentPage - 1))
  }

  const goToNext = () => {
    onPageChange(Math.min(totalPages, currentPage + 1))
  }

  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  // Don't render if there are no items or only one page and no items per page selector
  if (totalItems === 0 || (totalPages <= 1 && !showItemsPerPage)) {
    return null
  }

  return (
    <div className={`bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 ${className}`}>
      <div className="px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Items per page selector */}
          {showItemsPerPage && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Show:</span>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => onItemsPerPageChange(Number(value))}
              >
                <SelectTrigger className="w-20 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemsPerPageOptions.map(option => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-slate-600">per page</span>
            </div>
          )}

          {/* Page info */}
          {showPageInfo && (
            <div className="text-sm text-slate-600">
              {totalItems > 0 ? (
                <>
                  Showing {startIndex}-{endIndex} of {totalItems} items
                  {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                </>
              ) : (
                'No items found'
              )}
            </div>
          )}

          {/* Navigation buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              {showFirstLast && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 h-8 text-sm"
                >
                  First
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={currentPage === 1}
                className="px-3 py-1 h-8 text-sm"
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 h-8 text-sm ${
                        pageNum === currentPage 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                          : ''
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className="px-3 py-1 h-8 text-sm"
              >
                Next
              </Button>
              
              {showFirstLast && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 h-8 text-sm"
                >
                  Last
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook for pagination logic
export function usePagination<T>(
  items: T[],
  initialItemsPerPage: number = 10
) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage)

  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = items.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  // Reset to first page when items array changes (e.g., after filtering)
  React.useEffect(() => {
    setCurrentPage(1)
  }, [items.length])

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    currentItems,
    totalItems: items.length,
    handlePageChange,
    handleItemsPerPageChange,
    setCurrentPage,
    setItemsPerPage
  }
} 