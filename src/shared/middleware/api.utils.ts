// src/common/api.utils.ts
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

export interface SafeApiConfig {
  url: string;
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
  params?: Record<string, any>;
  data?: Record<string, any>;
  headers?: Record<string, string>;
  requireAuth?: boolean;
  apiKey?: string;
}

export interface ServerAuthConfig {
  apiKey: string;
  serviceName: string;
  timestamp?: number;
}

// Server-to-server authentication secret (should be in environment variables)
const SERVER_AUTH_SECRET = process.env.SERVER_AUTH_SECRET || 'your-server-auth-secret-key';

// Export header constants for use in other modules
export const API_KEY_HEADER = 'x-api-key';
export const SERVER_AUTH_HEADER = 'x-server-auth';
export const TIMESTAMP_HEADER = 'x-timestamp';
export const SERVICE_NAME_HEADER = 'x-service-name';

/**
 * Generate server-to-server authentication token
 */
export function generateServerAuthToken(serviceName: string, apiKey: string): string {
  const timestamp = Date.now();
  const payload = `${serviceName}:${apiKey}:${timestamp}:${SERVER_AUTH_SECRET}`;
  return Buffer.from(payload).toString('base64');
}

/**
 * Validate server-to-server authentication token
 */
export function validateServerAuthToken(token: string, serviceName: string, apiKey: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [tokenServiceName, tokenApiKey, timestamp, secret] = decoded.split(':');

    // Validate components
    if (tokenServiceName !== serviceName || tokenApiKey !== apiKey || secret !== SERVER_AUTH_SECRET) {
      return false;
    }

    // Check if token is not expired (5 minutes)
    const tokenTime = parseInt(timestamp);
    const currentTime = Date.now();
    const timeDiff = currentTime - tokenTime;
    const maxAge = 5 * 60 * 1000; // 5 minutes

    return timeDiff <= maxAge;
  } catch (e: any) {
    console.error(e);
    return false;
  }
}

/**
 * Block public access middleware
 */
export function blockPublicAccess(headers: Record<string, string>): boolean {
  const apiKey = headers[API_KEY_HEADER];
  const serverAuth = headers[SERVER_AUTH_HEADER];

  // Require either API key or server auth
  if (!apiKey && !serverAuth) {
    return false;
  }

  // If server auth is present, validate it
  if (serverAuth) {
    const serviceName = headers[SERVICE_NAME_HEADER];
    const timestamp = headers[TIMESTAMP_HEADER];

    if (!serviceName || !timestamp) {
      return false;
    }

    return validateServerAuthToken(serverAuth, serviceName, apiKey || '');
  }

  // If only API key is present, validate it
  return validateApiKey(apiKey);
}

/**
 * Validate API key
 */
function validateApiKey(apiKey: string): boolean {
  // Add your API key validation logic here
  // For now, we'll use a simple check against environment variable
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  return validApiKeys.includes(apiKey);
}

/**
 * Enhanced safeApiCall with server-to-server authentication
 */
export async function safeApiCall<T>(
  httpService: HttpService,
  config: SafeApiConfig,
  authConfig?: ServerAuthConfig,
): Promise<T> {
  try {
    // Prepare headers with authentication
    const headers: Record<string, string> = {
      ...config.headers,
    };

    // Add server-to-server authentication if provided
    if (authConfig) {
      const authToken = generateServerAuthToken(authConfig.serviceName, authConfig.apiKey);
      headers[SERVER_AUTH_HEADER] = authToken;
      headers[SERVICE_NAME_HEADER] = authConfig.serviceName;
      headers[TIMESTAMP_HEADER] = Date.now().toString();
      headers[API_KEY_HEADER] = authConfig.apiKey;
    }

    // Add API key if provided
    if (config.apiKey) {
      headers[API_KEY_HEADER] = config.apiKey;
    }

    // Block public access if authentication is required
    if (config.requireAuth !== false) {
      if (!blockPublicAccess(headers)) {
        throw new HttpException(
          {
            statusCode: 401,
            message: 'Authentication required',
            code: 'AUTHENTICATION_REQUIRED',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    const response = await firstValueFrom(
      httpService.request<T>({
        method: config.method || 'get',
        url: config.url,
        params: config.params,
        data: config.data,
        headers,
      }),
    );
    return response.data;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    if (error instanceof AxiosError) {
      throw new HttpException(
        {
          statusCode: error.response?.status || 500,
          message: 'API Request Failed',
          code: error.code || 'API_ERROR',
          details: error.response?.data as Record<string, any>,
        },
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    throw new HttpException(
      {
        statusCode: 500,
        message: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Server-to-server authenticated API call
 */
export async function serverToServerCall<T>(
  httpService: HttpService,
  config: SafeApiConfig,
  serviceName: string,
): Promise<T> {
  const authConfig: ServerAuthConfig = {
    apiKey: process.env.SERVER_API_KEY || 'default-server-key',
    serviceName,
  };
  console.log(config);

  return safeApiCall<T>(httpService, config, authConfig);
}

/**
 * Public API call (no authentication required)
 */
export async function publicApiCall<T>(httpService: HttpService, config: SafeApiConfig): Promise<T> {
  return safeApiCall<T>(httpService, { ...config, requireAuth: false });
}
