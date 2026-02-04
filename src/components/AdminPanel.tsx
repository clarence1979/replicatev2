import { useState, useEffect } from 'react';
import { X, Users, Key, Search, Plus, Edit, Trash2, Shield, ShieldOff, Save, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { migrateReplicateDeliveryVideos } from '../utils/migrateGenerations';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  adminName: string;
  adminPassword: string;
}

interface User {
  name: string;
  is_admin: boolean;
}

interface ApiKey {
  key_name: string;
  key_value: string;
}

export function AdminPanel({ isOpen, onClose, adminName, adminPassword }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'api' | 'utils'>('users');
  const [migrating, setMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState('');

  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add/Edit user modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({ username: '', password: '', isAdmin: false });

  // API key management state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [editingApiKey, setEditingApiKey] = useState<string | null>(null);
  const [apiKeyValues, setApiKeyValues] = useState<Record<string, string>>({});
  const [showApiKeyValues, setShowApiKeyValues] = useState<Record<string, boolean>>({});
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'users') {
        loadUsers();
      } else {
        loadApiKeys();
      }
    }
  }, [isOpen, activeTab]);

  const adminFetch = async (endpoint: string, action: string, params: any = {}) => {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminName,
        adminPassword,
        action,
        ...params,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  };

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('admin-users', searchQuery ? 'search' : 'list',
        searchQuery ? { query: searchQuery } : {});
      setUsers(data.users || []);
      setSelectedUsers(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadApiKeys = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('admin-api-keys', 'list');
      setApiKeys(data.apiKeys || []);
      const values: Record<string, string> = {};
      data.apiKeys?.forEach((key: ApiKey) => {
        values[key.key_name] = key.key_value;
      });
      setApiKeyValues(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setUserFormData({ username: '', password: '', isAdmin: false });
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({ username: user.name, password: '', isAdmin: user.is_admin });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    setError('');
    setSuccess('');
    try {
      if (editingUser) {
        await adminFetch('admin-users', 'update', {
          username: editingUser.name,
          password: userFormData.password || undefined,
          isAdmin: userFormData.isAdmin,
        });
        setSuccess('User updated successfully');
      } else {
        await adminFetch('admin-users', 'add', {
          username: userFormData.username,
          password: userFormData.password,
          isAdmin: userFormData.isAdmin,
        });
        setSuccess('User added successfully');
      }
      setShowUserModal(false);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    }
  };

  const handleDeleteUsers = async () => {
    if (selectedUsers.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)?`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await adminFetch('admin-users', 'delete', {
        usernames: Array.from(selectedUsers),
      });
      setSuccess(`${selectedUsers.size} user(s) deleted successfully`);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete users');
    }
  };

  const handleToggleAdmin = async (username: string, currentIsAdmin: boolean) => {
    setError('');
    setSuccess('');
    try {
      await adminFetch('admin-users', 'update', {
        username,
        isAdmin: !currentIsAdmin,
      });
      setSuccess(`User ${!currentIsAdmin ? 'promoted to' : 'demoted from'} admin`);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const handleSaveApiKey = async (keyName: string) => {
    setError('');
    setSuccess('');
    try {
      await adminFetch('admin-api-keys', 'update', {
        keyName,
        keyValue: apiKeyValues[keyName],
      });
      setSuccess('API key updated successfully');
      setEditingApiKey(null);
      loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update API key');
    }
  };

  const handleDeleteApiKey = async (keyName: string) => {
    if (!confirm(`Are you sure you want to delete the API key "${keyName}"?`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await adminFetch('admin-api-keys', 'delete', { keyName });
      setSuccess('API key deleted successfully');
      loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
    }
  };

  const handleAddApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a key name');
      return;
    }

    setError('');
    setSuccess('');
    try {
      await adminFetch('admin-api-keys', 'update', {
        keyName: newKeyName.toLowerCase().trim().replace(/\s+/g, '_'),
        keyValue: '',
      });
      setSuccess('API key added successfully');
      setShowAddKeyModal(false);
      setNewKeyName('');
      loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add API key');
    }
  };

  const toggleUserSelection = (username: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(username)) {
      newSelection.delete(username);
    } else {
      newSelection.add(username);
    }
    setSelectedUsers(newSelection);
  };

  const toggleAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.name)));
    }
  };

  const handleMigrateVideos = async () => {
    setMigrating(true);
    setMigrationMessage('');
    setError('');
    setSuccess('');
    try {
      await migrateReplicateDeliveryVideos();
      setMigrationMessage('Migration completed successfully!');
      setSuccess('Video thumbnails have been fixed');
      // Trigger a refresh of the generations display
      window.dispatchEvent(new CustomEvent('generation-saved'));
    } catch (error) {
      setMigrationMessage(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setError('Failed to migrate videos');
    } finally {
      setMigrating(false);
      setTimeout(() => {
        setMigrationMessage('');
        setError('');
        setSuccess('');
      }, 5000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users className="w-5 h-5" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'api'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Key className="w-5 h-5" />
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('utils')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'utils'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <RefreshCw className="w-5 h-5" />
            Utilities
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={loadUsers}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Search
                </button>
                <button
                  onClick={handleAddUser}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add User
                </button>
                {selectedUsers.size > 0 && (
                  <button
                    onClick={handleDeleteUsers}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete ({selectedUsers.size})
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No users found</div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedUsers.size === users.length && users.length > 0}
                            onChange={toggleAllUsers}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.name} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedUsers.has(user.name)}
                              onChange={() => toggleUserSelection(user.name)}
                              disabled={user.name === adminName}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {user.name}
                            {user.name === adminName && (
                              <span className="ml-2 text-xs text-gray-500">(you)</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {user.is_admin ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                <Shield className="w-3 h-3" />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                User
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit user"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleAdmin(user.name, user.is_admin)}
                                disabled={user.name === adminName}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={user.is_admin ? 'Demote from admin' : 'Promote to admin'}
                              >
                                {user.is_admin ? (
                                  <ShieldOff className="w-4 h-4" />
                                ) : (
                                  <Shield className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Manage API keys for third-party services</p>
                <button
                  onClick={() => setShowAddKeyModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add API Key
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No API keys found</div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.key_name}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {apiKey.key_name.replace(/_/g, ' ').toUpperCase()}
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type={showApiKeyValues[apiKey.key_name] ? 'text' : 'password'}
                                value={apiKeyValues[apiKey.key_name] || ''}
                                onChange={(e) =>
                                  setApiKeyValues({ ...apiKeyValues, [apiKey.key_name]: e.target.value })
                                }
                                disabled={editingApiKey !== apiKey.key_name}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 font-mono text-sm"
                              />
                              <button
                                onClick={() =>
                                  setShowApiKeyValues({
                                    ...showApiKeyValues,
                                    [apiKey.key_name]: !showApiKeyValues[apiKey.key_name],
                                  })
                                }
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showApiKeyValues[apiKey.key_name] ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            {editingApiKey === apiKey.key_name ? (
                              <>
                                <button
                                  onClick={() => handleSaveApiKey(apiKey.key_name)}
                                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingApiKey(null);
                                    setApiKeyValues({ ...apiKeyValues, [apiKey.key_name]: apiKey.key_value });
                                  }}
                                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditingApiKey(apiKey.key_name)}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteApiKey(apiKey.key_name)}
                                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'utils' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Fix Broken Video Thumbnails
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This tool will scan for videos with broken thumbnails (from replicate.delivery URLs) and migrate them to Supabase storage with proper thumbnail generation.
                </p>
                <button
                  onClick={handleMigrateVideos}
                  disabled={migrating}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    migrating
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {migrating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Migrating Videos...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Fix Video Thumbnails
                    </>
                  )}
                </button>
                {migrationMessage && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    migrationMessage.includes('success')
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {migrationMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {editingUser ? 'Edit User' : 'Add User'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  disabled={!!editingUser}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={editingUser ? 'Enter new password' : 'Enter password'}
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAdminCheckbox"
                  checked={userFormData.isAdmin}
                  onChange={(e) => setUserFormData({ ...userFormData, isAdmin: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isAdminCheckbox" className="text-sm font-medium text-gray-700">
                  Admin privileges
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingUser ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add API Key</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., openai_api, anthropic_api"
                />
                <p className="text-xs text-gray-500 mt-1">Use lowercase with underscores (e.g., service_api)</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddKeyModal(false);
                  setNewKeyName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddApiKey}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
