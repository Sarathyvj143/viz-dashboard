import {
  ShieldCheckIcon,
  PencilIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ServerIcon,
  CloudIcon,
} from '@heroicons/react/24/outline';
import { DropdownOption } from '../components/common/Dropdown';

/**
 * Role options for workspace members and user management
 * Used across: UserManagement, WorkspaceInvitations
 */
export const ROLE_OPTIONS: DropdownOption<'admin' | 'editor' | 'viewer'>[] = [
  {
    value: 'admin',
    label: 'Admin',
    icon: ShieldCheckIcon,
    description: 'Full system access including member management'
  },
  {
    value: 'editor',
    label: 'Editor',
    icon: PencilIcon,
    description: 'Can create and edit resources'
  },
  {
    value: 'viewer',
    label: 'Viewer',
    icon: UserIcon,
    description: 'Read-only access'
  },
];

/**
 * Permission level options for connection-specific permissions
 * Used in: ConnectionPermissions
 */
export const PERMISSION_LEVEL_OPTIONS: DropdownOption<'owner' | 'editor' | 'viewer'>[] = [
  {
    value: 'owner',
    label: 'Owner',
    icon: ShieldCheckIcon,
    description: 'Full access including permission management'
  },
  {
    value: 'editor',
    label: 'Editor',
    icon: PencilIcon,
    description: 'Can edit and view'
  },
  {
    value: 'viewer',
    label: 'Viewer',
    icon: UserIcon,
    description: 'Can view connection and data'
  },
];

/**
 * Status options for active/inactive filters
 * Used across: UserManagement, and other admin components
 */
export const STATUS_OPTIONS: DropdownOption<boolean>[] = [
  { value: true, label: 'Active', icon: CheckCircleIcon },
  { value: false, label: 'Inactive', icon: XCircleIcon },
];

/**
 * Connection type options for database and storage connections
 * Used in: ConnectionForm
 */
export const CONNECTION_TYPE_OPTIONS: DropdownOption<'mysql' | 'postgresql' | 's3' | 'azure_blob' | 'gcs'>[] = [
  {
    value: 'mysql',
    label: 'MySQL',
    icon: ServerIcon,
    description: 'Connect to MySQL database server'
  },
  {
    value: 'postgresql',
    label: 'PostgreSQL',
    icon: ServerIcon,
    description: 'Connect to PostgreSQL database server'
  },
  {
    value: 's3',
    label: 'AWS S3',
    icon: CloudIcon,
    description: 'Connect to AWS S3 bucket for file storage'
  },
  {
    value: 'azure_blob',
    label: 'Azure Blob Storage',
    icon: CloudIcon,
    description: 'Connect to Azure Blob Storage'
  },
  {
    value: 'gcs',
    label: 'Google Cloud Storage',
    icon: CloudIcon,
    description: 'Connect to Google Cloud Storage'
  },
];
