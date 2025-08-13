import React from 'react';
import { Pagination, Stack } from '@mui/material';

export default function MatchPagination({ page, pageSize, total, onChange }) {
  const pageCount = Math.ceil(total / pageSize);
  if (pageCount <= 1) return null;
  return (
    <Stack direction="row" justifyContent="center" sx={{ my: 2 }}>
      <Pagination
        count={pageCount}
        page={page}
        onChange={(_, v) => onChange(v)}
        color="primary"
      />
    </Stack>
  );
}
