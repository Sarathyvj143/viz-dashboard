import { useState, useEffect } from 'react';
import { useConnectionStore } from '../../store/connectionStore';
import { Connection, ConnectionType, ConnectionConfig } from '../../types/connection';
import Button from '../common/Button';
import Input from '../common/Input';
import { useToastStore } from '../../store/toastStore';
import { connectionsApi } from '../../api/connections';
import { validators, validationMessages } from '../../utils/validation';

interface ConnectionFormProps {
  connection?: Connection | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ConnectionForm({ connection, onSuccess, onCancel }: ConnectionFormProps) {
  const { createConnection, updateConnection } = useConnectionStore();
  const { showToast } = useToastStore();

  const [name, setName] = useState(connection?.name || '');
  const [type, setType] = useState<ConnectionType>(connection?.type || 'mysql');
  const [config, setConfig] = useState<ConnectionConfig>(
    connection?.config || {
      host: '',
      port: undefined,
      database: '',
      user: '',
      password: '',
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasBeenTested, setHasBeenTested] = useState(false);

  useEffect(() => {
    if (connection) {
      setName(connection.name);
      setType(connection.type);
      setConfig(connection.config);
    }
  }, [connection]);

  // Reset test state when config changes
  useEffect(() => {
    setHasBeenTested(false);
    setTestResult(null);
  }, [config]);

  // Reset config when type changes
  const handleTypeChange = (newType: ConnectionType) => {
    setType(newType);

    // Set default config based on type
    switch (newType) {
      case 'mysql':
        setConfig({ host: '', port: 3306, database: '', user: '', password: '' });
        break;
      case 'postgresql':
        setConfig({ host: '', port: 5432, database: '', user: '', password: '' });
        break;
      case 's3':
        setConfig({ bucket: '', region: 'us-east-1', accessKeyId: '', secretAccessKey: '' });
        break;
      case 'azure_blob':
        setConfig({ containerName: '', connectionString: '' });
        break;
      case 'gcs':
        setConfig({ projectId: '', bucket: '', keyFile: '' });
        break;
    }
  };

  const handleConfigChange = (field: string, value: string | number | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleTestCredentials = async (): Promise<void> => {
    // Basic validation
    if (!name.trim()) {
      showToast('Connection name is required', 'error');
      return;
    }

    // Validate required fields based on connection type
    if (type === 'mysql' || type === 'postgresql') {
      if (!config.host || !config.database || !config.user) {
        showToast('Please fill in all required fields (host, database, user)', 'error');
        return;
      }

      // Validate host format
      if (!validators.ipOrHostname(config.host)) {
        showToast(validationMessages.ipOrHostname, 'error');
        return;
      }

      // Validate port
      if (!validators.port(config.port)) {
        showToast(validationMessages.port, 'error');
        return;
      }

      // Validate database name format
      if (!validators.databaseName(config.database)) {
        showToast(validationMessages.databaseName, 'error');
        return;
      }
    } else if (type === 's3') {
      if (!config.bucket || !config.region || !config.accessKeyId || !config.secretAccessKey) {
        showToast('Please fill in all required S3 fields', 'error');
        return;
      }

      // Validate bucket name
      if (!validators.bucketName(config.bucket)) {
        showToast(validationMessages.bucketName, 'error');
        return;
      }

      // Validate AWS region
      if (!validators.awsRegion(config.region)) {
        showToast(validationMessages.awsRegion, 'error');
        return;
      }

      // Validate AWS Access Key format
      if (!validators.awsAccessKey(config.accessKeyId)) {
        showToast(validationMessages.awsAccessKey, 'error');
        return;
      }
    } else if (type === 'azure_blob') {
      if (!config.containerName || !config.connectionString) {
        showToast('Please fill in all required Azure fields', 'error');
        return;
      }
    } else if (type === 'gcs') {
      if (!config.projectId || !config.bucket || !config.keyFile) {
        showToast('Please fill in all required GCS fields', 'error');
        return;
      }

      // Validate bucket name
      if (!validators.bucketName(config.bucket)) {
        showToast(validationMessages.bucketName, 'error');
        return;
      }
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await connectionsApi.testCredentials({ name, type, config });
      setTestResult(result);

      if (result.success) {
        showToast(result.message, 'success');
        setHasBeenTested(true);
      } else {
        showToast(result.message, 'error');
        setHasBeenTested(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to test credentials';
      setTestResult({ success: false, message: errorMessage });
      showToast(errorMessage, 'error');
      setHasBeenTested(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Connection name is required', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (connection) {
        await updateConnection(connection.id, { name, config });
        showToast('Connection updated successfully', 'success');
      } else {
        await createConnection({ name, type, config });
        showToast('Connection created successfully', 'success');
      }
      onSuccess();
    } catch (error) {
      // Error already handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDatabaseFields = () => (
    <>
      <Input
        label="Host"
        value={config.host || ''}
        onChange={(e) => handleConfigChange('host', e.target.value)}
        placeholder="localhost or IP address"
        required
      />
      <Input
        label="Port"
        type="number"
        value={config.port || ''}
        onChange={(e) => handleConfigChange('port', parseInt(e.target.value) || undefined)}
        placeholder={type === 'mysql' ? '3306' : '5432'}
        required
      />
      <Input
        label="Database"
        value={config.database || ''}
        onChange={(e) => handleConfigChange('database', e.target.value)}
        placeholder="Database name"
        required
      />
      <Input
        label="Username"
        value={config.user || ''}
        onChange={(e) => handleConfigChange('user', e.target.value)}
        placeholder="Database user"
        required
      />
      <Input
        label="Password"
        type="password"
        value={config.password || ''}
        onChange={(e) => handleConfigChange('password', e.target.value)}
        placeholder="Database password"
        required
      />
      <div className="flex items-center">
        <input
          type="checkbox"
          id="ssl"
          checked={config.ssl || false}
          onChange={(e) => handleConfigChange('ssl', e.target.checked)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="ssl" className="ml-2 text-sm text-gray-700">
          Use SSL/TLS connection
        </label>
      </div>
      {config.ssl && (
        <Input
          label="SSL Certificate Path (optional)"
          value={config.sslCert || ''}
          onChange={(e) => handleConfigChange('sslCert', e.target.value)}
          placeholder="/path/to/certificate.pem"
        />
      )}
    </>
  );

  const renderS3Fields = () => (
    <>
      <Input
        label="Bucket Name"
        value={config.bucket || ''}
        onChange={(e) => handleConfigChange('bucket', e.target.value)}
        placeholder="my-bucket"
        required
      />
      <Input
        label="Region"
        value={config.region || ''}
        onChange={(e) => handleConfigChange('region', e.target.value)}
        placeholder="us-east-1"
        required
      />
      <Input
        label="Access Key ID"
        value={config.accessKeyId || ''}
        onChange={(e) => handleConfigChange('accessKeyId', e.target.value)}
        placeholder="AKIAIOSFODNN7EXAMPLE"
        required
      />
      <Input
        label="Secret Access Key"
        type="password"
        value={config.secretAccessKey || ''}
        onChange={(e) => handleConfigChange('secretAccessKey', e.target.value)}
        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        required
      />
    </>
  );

  const renderAzureFields = () => (
    <>
      <Input
        label="Container Name"
        value={config.containerName || ''}
        onChange={(e) => handleConfigChange('containerName', e.target.value)}
        placeholder="my-container"
        required
      />
      <Input
        label="Connection String"
        type="password"
        value={config.connectionString || ''}
        onChange={(e) => handleConfigChange('connectionString', e.target.value)}
        placeholder="DefaultEndpointsProtocol=https;AccountName=..."
        required
      />
    </>
  );

  const renderGCSFields = () => (
    <>
      <Input
        label="Project ID"
        value={config.projectId || ''}
        onChange={(e) => handleConfigChange('projectId', e.target.value)}
        placeholder="my-project-id"
        required
      />
      <Input
        label="Bucket Name"
        value={config.bucket || ''}
        onChange={(e) => handleConfigChange('bucket', e.target.value)}
        placeholder="my-bucket"
        required
      />
      <Input
        label="Service Account Key File Path"
        value={config.keyFile || ''}
        onChange={(e) => handleConfigChange('keyFile', e.target.value)}
        placeholder="/path/to/service-account-key.json"
        required
      />
    </>
  );

  const renderTypeSpecificFields = () => {
    switch (type) {
      case 'mysql':
      case 'postgresql':
        return renderDatabaseFields();
      case 's3':
        return renderS3Fields();
      case 'azure_blob':
        return renderAzureFields();
      case 'gcs':
        return renderGCSFields();
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Connection Name */}
      <Input
        label="Connection Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="My Database Connection"
        required
      />

      {/* Connection Type */}
      {!connection && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Connection Type
          </label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as ConnectionType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="s3">AWS S3</option>
            <option value="azure_blob">Azure Blob Storage</option>
            <option value="gcs">Google Cloud Storage</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {type === 'mysql' && 'Connect to MySQL database'}
            {type === 'postgresql' && 'Connect to PostgreSQL database'}
            {type === 's3' && 'Connect to AWS S3 bucket for file storage'}
            {type === 'azure_blob' && 'Connect to Azure Blob Storage'}
            {type === 'gcs' && 'Connect to Google Cloud Storage'}
          </p>
        </div>
      )}

      {/* Type-specific configuration fields */}
      {renderTypeSpecificFields()}

      {/* Advanced Options */}
      {(type === 'mysql' || type === 'postgresql') && (
        <details className="border border-gray-200 rounded-md p-4">
          <summary className="cursor-pointer font-medium text-gray-700">
            Advanced Options
          </summary>
          <div className="mt-4 space-y-4">
            <Input
              label="Connection Pool Size"
              type="number"
              value={config.poolSize || ''}
              onChange={(e) => handleConfigChange('poolSize', parseInt(e.target.value) || undefined)}
              placeholder="10"
            />
            <Input
              label="Max Overflow"
              type="number"
              value={config.maxOverflow || ''}
              onChange={(e) => handleConfigChange('maxOverflow', parseInt(e.target.value) || undefined)}
              placeholder="5"
            />
          </div>
        </details>
      )}

      {/* Test Credentials Section */}
      <div className="border-t border-gray-200 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={handleTestCredentials}
          disabled={isTesting || isSubmitting}
        >
          {isTesting ? 'Testing...' : 'Test Credentials'}
        </Button>

        {testResult && (
          <div
            className={`mt-3 p-3 rounded-md ${
              testResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {testResult.success ? '✓ ' : '✗ '}
              {testResult.message}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-4">
        {!hasBeenTested && !connection && (
          <p className="text-sm text-amber-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Recommended: Test credentials before saving
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? connection
                ? 'Updating...'
                : 'Creating...'
              : connection
              ? 'Update Connection'
              : 'Create Connection'}
          </Button>
        </div>
      </div>
    </form>
  );
}
