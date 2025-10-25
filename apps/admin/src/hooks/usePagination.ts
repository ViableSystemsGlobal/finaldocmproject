import { useState, useMemo } from 'react'

export interface PaginationOptions {
  initialPage?: number
  initialPageSize?: number
  totalItems: number
}

export interface PaginationResult<T> {
  currentPage: number
  pageSize: number
  totalPages: number
  totalItems: number
  paginatedData: T[]
  startIndex: number
  endIndex: number
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  goToFirstPage: () => void
  goToLastPage: () => void
  hasNextPage: boolean
  hasPreviousPage: boolean
  reset: () => void
}

export function usePagination<T>(
  data: T[],
  options: PaginationOptions = { totalItems: 0 }
): PaginationResult<T> {
  const {
    initialPage = 1,
    initialPageSize = 10,
    totalItems = data.length
  } = options

  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalPages = Math.ceil(totalItems / pageSize)

  // Adjust current page if it's out of range
  const adjustedCurrentPage = useMemo(() => {
    if (totalPages === 0) return 1
    if (currentPage > totalPages) return totalPages
    if (currentPage < 1) return 1
    return currentPage
  }, [currentPage, totalPages])

  const startIndex = (adjustedCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, data.length)

  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex)
  }, [data, startIndex, endIndex])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    const currentItem = (adjustedCurrentPage - 1) * pageSize + 1
    const newPage = Math.ceil(currentItem / newPageSize)
    setPageSize(newPageSize)
    setCurrentPage(newPage)
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)

  const hasNextPage = adjustedCurrentPage < totalPages
  const hasPreviousPage = adjustedCurrentPage > 1

  const reset = () => {
    setCurrentPage(1)
    setPageSize(initialPageSize)
  }

  return {
    currentPage: adjustedCurrentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    startIndex,
    endIndex,
    setCurrentPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    goToFirstPage,
    goToLastPage,
    hasNextPage,
    hasPreviousPage,
    reset
  }
} 