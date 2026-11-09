import type { ComponentType } from 'react';
import ReactPaginateModule from 'react-paginate';
import type { ReactPaginateProps } from 'react-paginate';
import css from './Pagination.module.css';

type ModuleWithDefault<T> = { default: T };

const ReactPaginate = (
  ReactPaginateModule as unknown as ModuleWithDefault<
    ComponentType<ReactPaginateProps>
  >
).default;

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  return (
    <nav aria-label="Notes pagination">
      <ReactPaginate
        pageCount={totalPages}
        forcePage={currentPage - 1}
        onPageChange={({ selected }: { selected: number }) =>
          onPageChange(selected + 1)
        }
        pageRangeDisplayed={3}
        marginPagesDisplayed={1}
        previousLabel="←"
        nextLabel="→"
        breakLabel="…"
        containerClassName={css.pagination}
        activeClassName={css.active}
        disabledClassName={css.disabled}
      />
    </nav>
  );
}
