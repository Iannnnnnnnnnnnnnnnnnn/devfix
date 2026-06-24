import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  title: ReactNode;
  width?: number | string;
  className?: string;
  render: (row: T, index: number) => ReactNode;
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyText = '暂无数据',
  selectedRowKeys,
  onSelectedRowKeysChange,
}: {
  columns: Array<DataTableColumn<T>>;
  data: T[];
  rowKey: (row: T) => number | string;
  loading?: boolean;
  emptyText?: string;
  selectedRowKeys?: Array<number | string>;
  onSelectedRowKeysChange?: (keys: Array<number | string>) => void;
}) {
  const selectable = Boolean(selectedRowKeys && onSelectedRowKeysChange);
  const allKeys = data.map(rowKey);
  const checkedCount = selectedRowKeys?.filter((key) => allKeys.includes(key)).length || 0;
  const allChecked = allKeys.length > 0 && checkedCount === allKeys.length;
  const indeterminate = checkedCount > 0 && checkedCount < allKeys.length;

  function toggleAll(checked: boolean) {
    if (!onSelectedRowKeysChange || !selectedRowKeys) {
      return;
    }
    if (checked) {
      onSelectedRowKeysChange(Array.from(new Set([...selectedRowKeys, ...allKeys])));
      return;
    }
    onSelectedRowKeysChange(selectedRowKeys.filter((key) => !allKeys.includes(key)));
  }

  function toggleOne(key: number | string, checked: boolean) {
    if (!onSelectedRowKeysChange || !selectedRowKeys) {
      return;
    }
    if (checked) {
      onSelectedRowKeysChange(Array.from(new Set([...selectedRowKeys, key])));
      return;
    }
    onSelectedRowKeysChange(selectedRowKeys.filter((item) => item !== key));
  }

  return (
    <div className="table-wrap admin-table-wrap">
      <table className="data-table admin-data-table">
        <thead>
          <tr>
            {selectable ? (
              <th className="checkbox-cell">
                <input
                  aria-label="全选当前页"
                  checked={allChecked}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = indeterminate;
                    }
                  }}
                  type="checkbox"
                  onChange={(event) => toggleAll(event.target.checked)}
                />
              </th>
            ) : null}
            {columns.map((column) => (
              <th className={column.className} key={column.key} style={{ width: column.width }}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="table-state-cell" colSpan={columns.length + (selectable ? 1 : 0)}>
                加载中...
              </td>
            </tr>
          ) : data.length ? (
            data.map((row, index) => {
              const key = rowKey(row);
              return (
                <tr key={key}>
                  {selectable ? (
                    <td className="checkbox-cell">
                      <input
                        aria-label="选择当前行"
                        checked={selectedRowKeys?.includes(key) || false}
                        type="checkbox"
                        onChange={(event) => toggleOne(key, event.target.checked)}
                      />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td className={column.className} key={column.key}>
                      {column.render(row, index)}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="table-state-cell" colSpan={columns.length + (selectable ? 1 : 0)}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
