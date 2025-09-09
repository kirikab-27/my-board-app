'use client';

import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Flag as FlagIcon } from '@mui/icons-material';
import ReportDialog from './ReportDialog';

/**
 * 通報ボタンコンポーネント
 * Issue #60: レポート・通報システム
 */

interface ReportButtonProps {
  targetType: 'post' | 'comment' | 'user' | 'media';
  targetId: string;
  targetContent?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function ReportButton({
  targetType,
  targetId,
  targetContent,
  size = 'small',
}: ReportButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Tooltip title="通報する">
        <IconButton
          size={size}
          onClick={() => setDialogOpen(true)}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'error.main',
            },
          }}
        >
          <FlagIcon fontSize={size} />
        </IconButton>
      </Tooltip>

      <ReportDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        targetType={targetType}
        targetId={targetId}
        targetContent={targetContent}
      />
    </>
  );
}
