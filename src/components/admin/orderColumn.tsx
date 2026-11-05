import type { Column } from "@/components/admin/DataTable";
import { MoveButtons } from "@/components/admin/MoveButtons";
import { moveItem } from "@/lib/admin/actions";
import type { EntityKey } from "@/lib/admin/forms";

/**
 * The „Подредба“ column: up/down arrows that move an item one place in its list. `rows` must be in the
 * order the list shows them (sort_order, then name). With `groupOf`, items move only within their group.
 */
export function orderColumn<T extends { id: string }>(
  key: Exclude<EntityKey, "settings">,
  rows: T[],
  nameOf: (row: T) => string,
  groupOf: (row: T) => string = () => "",
): Column<T> {
  const place = new Map(
    rows.map((row, i) => [
      row.id,
      {
        isFirst: groupOf(rows[i - 1] ?? row) !== groupOf(row) || i === 0,
        isLast: i === rows.length - 1 || groupOf(rows[i + 1]!) !== groupOf(row),
      },
    ]),
  );
  return {
    label: "Подредба",
    nowrap: true,
    render: (row) => {
      const { isFirst, isLast } = place.get(row.id) ?? { isFirst: true, isLast: true };
      return <MoveButtons name={nameOf(row)} move={moveItem.bind(null, key, row.id)} isFirst={isFirst} isLast={isLast} />;
    },
  };
}
