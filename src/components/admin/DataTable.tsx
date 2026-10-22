import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

export type Column<T> = {
  label: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  /** Keep the cell on one line (dates, prices, buttons). */
  nowrap?: boolean;
};

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  empty: string;
  caption?: string;
};

/** Admin list table. Scrolls sideways on narrow screens instead of squeezing the columns. */
export function DataTable<T>({ rows, columns, rowKey, empty, caption }: DataTableProps<T>) {
  if (!rows.length) {
    return (
      <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: "14px", p: 3, bgcolor: "background.paper" }}>
        <Typography sx={{ color: "text.secondary" }}>{empty}</Typography>
      </Box>
    );
  }
  return (
    <Box
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: "14px", bgcolor: "background.paper", overflowX: "auto" }}
    >
      <Table size="small" aria-label={caption}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.label}
                align={column.align}
                sx={{ fontWeight: 600, color: "primary.main", whiteSpace: "nowrap", bgcolor: "brand.mint" }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)} hover>
              {columns.map((column) => (
                <TableCell
                  key={column.label}
                  align={column.align}
                  sx={{ whiteSpace: column.nowrap ? "nowrap" : undefined, verticalAlign: "top", py: 1.25 }}
                >
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
