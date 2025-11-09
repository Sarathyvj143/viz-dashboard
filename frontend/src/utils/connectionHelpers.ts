import { ConnectionType, Connection } from '../types/connection';

export const getConnectionTypeLabel = (type: ConnectionType): string => {
  const labels: Record<ConnectionType, string> = {
    mysql: 'MySQL',
    postgresql: 'PostgreSQL',
    s3: 'AWS S3',
    azure_blob: 'Azure Blob Storage',
    gcs: 'Google Cloud Storage',
  };
  return labels[type] || type;
};

export const getConnectionTypeIcon = (type: ConnectionType): string => {
  const icons: Record<ConnectionType, string> = {
    mysql: '🐬',
    postgresql: '🐘',
    s3: '☁️',
    azure_blob: '☁️',
    gcs: '☁️',
  };
  return icons[type] || '🔌';
};

export const getConnectionDetails = (connection: Connection): string => {
  const details: string[] = [];

  if (connection.config.host) {
    const hostPort = connection.config.port
      ? `${connection.config.host}:${connection.config.port}`
      : connection.config.host;
    details.push(hostPort);
  }

  if (connection.config.database) {
    details.push(connection.config.database);
  }

  if (connection.config.bucket) {
    details.push(connection.config.bucket);
  }

  if (connection.config.region) {
    details.push(connection.config.region);
  }

  return details.join(' • ');
};
