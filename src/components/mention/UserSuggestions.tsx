'use client';

import React from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  Fade,
  Popper
} from '@mui/material';
import { User } from './useMention';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

export interface UserSuggestionsProps {
  suggestions: User[];
  selectedIndex: number;
  isLoading: boolean;
  show: boolean;
  anchorEl: HTMLElement | null;
  onSelect: (user: User) => void;
  onMouseEnter: (index: number) => void;
}

export const UserSuggestions: React.FC<UserSuggestionsProps> = ({
  suggestions,
  selectedIndex,
  isLoading,
  show,
  anchorEl,
  onSelect,
  onMouseEnter
}) => {
  if (!show || (!isLoading && suggestions.length === 0)) {
    return null;
  }

  return (
    <Popper
      open={show}
      anchorEl={anchorEl}
      placement="bottom-start"
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, 4],
          },
        },
        {
          name: 'preventOverflow',
          options: {
            padding: 8,
          },
        },
      ]}
      style={{ zIndex: 9999 }}
    >
      <Fade in={show}>
        <Paper
          elevation={8}
          sx={{
            minWidth: 280,
            maxWidth: 400,
            maxHeight: 300,
            overflow: 'auto',
            border: 1,
            borderColor: 'divider',
          }}
        >
          {isLoading ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
              }}
            >
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography variant="body2" color="text.secondary">
                ユーザーを検索中...
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {suggestions.map((user, index) => (
                <ListItem
                  key={user._id}
                  onClick={() => onSelect(user)}
                  onMouseEnter={() => onMouseEnter(index)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: index === selectedIndex ? 'action.selected' : 'transparent',
                    '&:hover': {
                      backgroundColor: index === selectedIndex ? 'action.selected' : 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    {user.avatar ? (
                      <Avatar src={user.avatar} alt={user.name} />
                    ) : (
                      <ProfileAvatar name={user.name} size="small" />
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {user.displayName || user.name}
                        </Typography>
                        {user.username && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.75rem' }}
                          >
                            @{user.username}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      user.username ? (
                        <Typography variant="caption" color="text.secondary">
                          {user.name}
                        </Typography>
                      ) : undefined
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Fade>
    </Popper>
  );
};

export default UserSuggestions;