'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Skeleton,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Badge,
  List,
  ListItem,
  ListItemText,
  Stack,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Shield as ShieldIcon,
  Security as SecurityIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  VpnKey as VpnKeyIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';

interface Role {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  inheritFrom?: string;
  priority: number;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  resource: string;
  action: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresMFA: boolean;
  requiresApproval: boolean;
  category: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`role-tabpanel-${index}`}
      aria-labelledby={`role-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // ダイアログ状態
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Partial<Role>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // データ取得
  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/rbac/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/rbac/permissions');
      if (!response.ok) throw new Error('Failed to fetch permissions');
      const data = await response.json();
      setPermissions(data.permissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRoles(), fetchPermissions()]);
      setLoading(false);
    };
    loadData();
  }, [fetchRoles, fetchPermissions]);

  // ロール編集
  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setEditingRole({
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions,
      inheritFrom: role.inheritFrom,
      priority: role.priority,
    });
    setSelectedPermissions(role.permissions);
    setEditDialog(true);
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/admin/rbac/roles/${selectedRole._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingRole,
          permissions: selectedPermissions,
        }),
      });

      if (!response.ok) throw new Error('Failed to update role');

      setSuccess('ロールを更新しました');
      setEditDialog(false);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  // ロール削除
  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/admin/rbac/roles/${selectedRole._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete role');
      }

      setSuccess('ロールを削除しました');
      setDeleteDialog(false);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  // 権限の選択
  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  // リスクレベルの色
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // ロールアイコン
  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'super_admin':
        return <AdminIcon color="error" />;
      case 'admin':
        return <SecurityIcon color="warning" />;
      case 'moderator':
        return <ShieldIcon color="info" />;
      default:
        return <VpnKeyIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab
                label={
                  <Badge badgeContent={roles.length} color="primary">
                    ロール管理
                  </Badge>
                }
              />
              <Tab
                label={
                  <Badge badgeContent={permissions.length} color="secondary">
                    権限一覧
                  </Badge>
                }
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ロール</TableCell>
                    <TableCell>表示名</TableCell>
                    <TableCell>説明</TableCell>
                    <TableCell align="center">権限数</TableCell>
                    <TableCell align="center">ユーザー数</TableCell>
                    <TableCell align="center">優先度</TableCell>
                    <TableCell align="center">システム</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRoleIcon(role.name)}
                          <Typography variant="body2" fontWeight="bold">
                            {role.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{role.displayName}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {role.description}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={role.permissions.length} size="small" color="primary" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={role.userCount}
                          size="small"
                          color={role.userCount > 0 ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">{role.priority}</TableCell>
                      <TableCell align="center">
                        {role.isSystem ? (
                          <CheckIcon color="success" />
                        ) : (
                          <ClearIcon color="disabled" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleEditRole(role)}
                          disabled={role.isSystem && role.name !== 'super_admin'}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRole(role);
                            setDeleteDialog(true);
                          }}
                          disabled={role.isSystem || role.userCount > 0}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {Object.entries(
                permissions.reduce((acc: any, perm) => {
                  if (!acc[perm.category]) acc[perm.category] = [];
                  acc[perm.category].push(perm);
                  return acc;
                }, {})
              ).map(([category, perms]) => (
                <Box key={category} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {category}
                      </Typography>
                      <List dense>
                        {(perms as Permission[]).map((perm) => (
                          <ListItem key={perm._id}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2">{perm.name}</Typography>
                                  <Chip
                                    label={perm.riskLevel}
                                    size="small"
                                    color={getRiskColor(perm.riskLevel) as any}
                                  />
                                  {perm.requiresMFA && (
                                    <Chip label="2FA" size="small" color="warning" />
                                  )}
                                  {perm.requiresApproval && (
                                    <Chip label="承認必須" size="small" color="error" />
                                  )}
                                </Box>
                              }
                              secondary={perm.description}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>ロール編集: {selectedRole?.displayName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="表示名"
              value={editingRole.displayName || ''}
              onChange={(e) => setEditingRole({ ...editingRole, displayName: e.target.value })}
              fullWidth
            />
            <TextField
              label="説明"
              value={editingRole.description || ''}
              onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="優先度"
              type="number"
              value={editingRole.priority || 0}
              onChange={(e) =>
                setEditingRole({ ...editingRole, priority: parseInt(e.target.value) })
              }
              fullWidth
            />

            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              権限設定
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
              {permissions.map((perm) => (
                <FormControlLabel
                  key={perm._id}
                  control={
                    <Checkbox
                      checked={selectedPermissions.includes(perm.name)}
                      onChange={() => handlePermissionToggle(perm.name)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{perm.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {perm.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>キャンセル</Button>
          <Button onClick={handleSaveRole} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>ロール削除の確認</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            ロール「{selectedRole?.displayName}」を削除してもよろしいですか？
            この操作は取り消せません。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>キャンセル</Button>
          <Button onClick={handleDeleteRole} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
