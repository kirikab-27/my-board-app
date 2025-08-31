'use client';

import { forwardRef } from 'react';
import {
  TextField,
  IconButton,
  InputAdornment,
  TextFieldProps,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { usePasswordVisibility } from '@/hooks/usePasswordVisibility';

/**
 * パスワード表示切り替え機能付きTextFieldコンポーネント
 * Issue #42: Hydration安全・SSR無効化対応
 */

interface PasswordFieldWithToggleProps extends Omit<TextFieldProps, 'type'> {
  fieldId?: string;
}

const PasswordFieldWithToggle = forwardRef<HTMLInputElement, PasswordFieldWithToggleProps>(
  ({ fieldId, ...props }, ref) => {
    const { isVisible, toggleVisibility, inputType, ariaLabel, showToggle } = usePasswordVisibility();

    return (
      <TextField
        {...props}
        ref={ref}
        id={fieldId}
        type={inputType}
        InputProps={{
          ...props.InputProps,
          endAdornment: showToggle ? (
            <InputAdornment position="end">
              <IconButton
                aria-label={ariaLabel}
                onClick={toggleVisibility}
                edge="end"
                disabled={props.disabled}
              >
                {isVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
    );
  }
);

PasswordFieldWithToggle.displayName = 'PasswordFieldWithToggle';

export default PasswordFieldWithToggle;