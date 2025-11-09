import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const chartSchema = z.object({
  name: z.string().min(1, 'Chart name is required'),
  description: z.string().optional(),
  type: z.enum(['bar', 'line', 'pie', 'area', 'scatter']),
  dataSourceId: z.string().min(1, 'Data source is required'),
  query: z.string().min(1, 'Query is required'),
  config: z.record(z.unknown()).optional(),
});

export const dashboardSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required'),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  layout: z.array(
    z.object({
      i: z.string(),
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
      chartId: z.string(),
    })
  ).default([]),
});

export const dataSourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['postgresql', 'mysql', 'mongodb']),
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535),
  database: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChartFormData = z.infer<typeof chartSchema>;
export type DashboardFormData = z.infer<typeof dashboardSchema>;
export type DataSourceFormData = z.infer<typeof dataSourceSchema>;
