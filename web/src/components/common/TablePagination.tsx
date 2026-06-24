const pageSizeOptions = [10, 20, 50, 100];

export default function TablePagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pages = buildPages(safePage, totalPages);

  return (
    <div className="table-pagination">
      <span>共 {total} 条</span>
      <select
        value={pageSize}
        onChange={(event) => {
          onPageSizeChange(Number(event.target.value));
        }}
      >
        {pageSizeOptions.map((item) => (
          <option key={item} value={item}>
            {item} 条/页
          </option>
        ))}
      </select>
      <button type="button" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}>
        &lt;
      </button>
      {pages.map((item, index) =>
        item === 'ellipsis' ? (
          <span className="pagination-ellipsis" key={`${item}-${index}`}>
            ...
          </span>
        ) : (
          <button
            className={item === safePage ? 'active' : ''}
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button type="button" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)}>
        &gt;
      </button>
      <label className="pagination-jump">
        前往
        <input
          min={1}
          max={totalPages}
          type="number"
          defaultValue={safePage}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') {
              return;
            }
            const next = Number((event.target as HTMLInputElement).value);
            if (Number.isFinite(next)) {
              onPageChange(Math.min(Math.max(next, 1), totalPages));
            }
          }}
          onBlur={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next) && next !== safePage) {
              onPageChange(Math.min(Math.max(next, 1), totalPages));
            }
          }}
        />
        页
      </label>
    </div>
  );
}

function buildPages(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const result: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) {
    result.push('ellipsis');
  }
  for (let item = start; item <= end; item += 1) {
    result.push(item);
  }
  if (end < total - 1) {
    result.push('ellipsis');
  }
  result.push(total);
  return result;
}
