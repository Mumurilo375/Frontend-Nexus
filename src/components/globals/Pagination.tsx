import type { ChangeEvent } from "react";
import MuiPagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const handleChange = (_event: ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  return (
    <Stack
      spacing={1.5}
      sx={{
        mt: 4,
        alignItems: "center",
      }}
    >
      <Typography
        sx={{
          color: "rgb(148 163 184)",
          fontSize: "0.85rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Pagina {page} de {totalPages}
      </Typography>

      <MuiPagination
        count={totalPages}
        page={page}
        onChange={handleChange}
        shape="rounded"
        size="large"
        sx={{
          "& .MuiPagination-ul": {
            gap: "0.4rem",
            flexWrap: "nowrap",
          },
          "& .MuiPaginationItem-root": {
            color: "#e2e8f0",
            borderRadius: "16px",
            border: "1px solid rgba(51, 65, 85, 0.95)",
            backgroundColor: "rgba(2, 6, 23, 0.82)",
            minWidth: "42px",
            height: "42px",
            transition: "all 0.2s ease",
          },
          "& .MuiPaginationItem-root:hover": {
            backgroundColor: "rgba(15, 23, 42, 0.98)",
            borderColor: "rgba(59, 130, 246, 0.55)",
          },
          "& .MuiPaginationItem-root.Mui-selected": {
            backgroundColor: "rgba(37, 99, 235, 0.2)",
            borderColor: "rgba(59, 130, 246, 0.7)",
            color: "#ffffff",
          },
          "& .MuiPaginationItem-root.Mui-selected:hover": {
            backgroundColor: "rgba(37, 99, 235, 0.28)",
          },
          "& .MuiPaginationItem-previousNext": {
            px: 1.1,
          },
          "& .MuiPaginationItem-ellipsis": {
            border: "none",
            backgroundColor: "transparent",
          },
        }}
      />
    </Stack>
  );
}
