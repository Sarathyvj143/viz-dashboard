/**
 * Validation utilities for connection forms
 */

export const validators = {
  /**
   * Validate IP address or hostname
   */
  ipOrHostname: (value: string): boolean => {
    if (!value) return false;

    // Allow localhost
    if (value === 'localhost') return true;

    // IP address pattern (IPv4)
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipPattern.test(value)) return true;

    // Hostname pattern (basic DNS name validation)
    const hostnamePattern = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)$/;
    return hostnamePattern.test(value);
  },

  /**
   * Validate port number (1-65535)
   */
  port: (value: number | undefined): boolean => {
    return value !== undefined && value > 0 && value <= 65535;
  },

  /**
   * Validate AWS Access Key ID format
   */
  awsAccessKey: (value: string): boolean => {
    if (!value) return false;
    // AWS Access Keys start with AKIA for IAM users
    return /^AKIA[0-9A-Z]{16}$/.test(value);
  },

  /**
   * Validate AWS region
   */
  awsRegion: (value: string): boolean => {
    const validRegions = [
      'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
      'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
      'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
      'ca-central-1', 'sa-east-1'
    ];
    return validRegions.includes(value);
  },

  /**
   * Validate database name (alphanumeric, underscore, hyphen)
   */
  databaseName: (value: string): boolean => {
    if (!value) return false;
    return /^[a-zA-Z0-9_-]+$/.test(value);
  },

  /**
   * Validate bucket name (S3/GCS)
   */
  bucketName: (value: string): boolean => {
    if (!value) return false;
    // Bucket names must be 3-63 characters, lowercase, numbers, hyphens, dots
    return /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(value);
  }
};

/**
 * Get user-friendly error messages for validation failures
 */
export const validationMessages = {
  ipOrHostname: 'Invalid host format. Use IP address or hostname (e.g., 192.168.1.1 or db.example.com)',
  port: 'Port must be between 1 and 65535',
  awsAccessKey: 'Invalid AWS Access Key ID format (should start with AKIA)',
  awsRegion: 'Invalid AWS region',
  databaseName: 'Database name can only contain letters, numbers, underscores, and hyphens',
  bucketName: 'Bucket name must be 3-63 characters, lowercase letters, numbers, hyphens, and dots'
};
