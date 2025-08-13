'use client';

import { Avatar, AvatarProps } from '@mui/material';
import { deepOrange, deepPurple, blue, green, pink, indigo } from '@mui/material/colors';

interface ProfileAvatarProps extends Omit<AvatarProps, 'children'> {
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

// 名前から色を決定する関数
const getColorFromName = (name: string) => {
  if (!name) return deepOrange[500];
  
  const colors = [
    deepOrange[500],
    deepPurple[500],
    blue[500],
    green[500],
    pink[500],
    indigo[500],
  ];
  
  // 名前の文字コードの合計を使って色を決定
  const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[charCodeSum % colors.length];
};

// サイズの定義
const getSizeStyles = (size: ProfileAvatarProps['size']) => {
  switch (size) {
    case 'small':
      return { width: 32, height: 32, fontSize: 14 };
    case 'medium':
      return { width: 40, height: 40, fontSize: 18 };
    case 'large':
      return { width: 56, height: 56, fontSize: 24 };
    case 'xlarge':
      return { width: 80, height: 80, fontSize: 32 };
    default:
      return { width: 40, height: 40, fontSize: 18 };
  }
};

export function ProfileAvatar({ name, size = 'medium', sx, ...props }: ProfileAvatarProps) {
  // 名前から頭文字を取得
  const getInitial = (name?: string) => {
    if (!name) return '?';
    
    // 日本語の場合は最初の1文字
    if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(name)) {
      return name.charAt(0);
    }
    
    // 英語の場合は最初の文字を大文字に
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      // 名前と姓がある場合は両方の頭文字
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    
    return name.charAt(0).toUpperCase();
  };

  const initial = getInitial(name);
  const backgroundColor = getColorFromName(name || '');
  const sizeStyles = getSizeStyles(size);

  return (
    <Avatar
      {...props}
      sx={{
        ...sizeStyles,
        backgroundColor,
        fontWeight: 'bold',
        ...sx,
      }}
    >
      {initial}
    </Avatar>
  );
}