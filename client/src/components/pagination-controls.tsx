import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function PaginationControls({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  className = ""
}: PaginationControlsProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Always render pagination controls for consistency, but disable navigation when only one page
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Pagination Controls */}
      <Pagination>
        <PaginationContent>
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              style={{ 
                backgroundColor: currentPage === 1 ? undefined : "#29A378",
                color: currentPage === 1 ? undefined : "white"
              }}
            />
          </PaginationItem>

          {/* Page Numbers */}
          {totalPages > 1 && Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={currentPage === page}
                onClick={() => onPageChange(page)}
                style={{ 
                  backgroundColor: currentPage === page ? "#29A378" : undefined,
                  color: currentPage === page ? "white" : undefined
                }}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              style={{ 
                backgroundColor: currentPage === totalPages ? undefined : "#29A378",
                color: currentPage === totalPages ? undefined : "white"
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
