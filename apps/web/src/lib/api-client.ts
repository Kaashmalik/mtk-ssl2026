import { z } from "zod";

export class APIError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = "APIError";
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

export async function apiClient<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options: FetchOptions = {}
): Promise<T> {
  let url = `/api/v1${endpoint}`;
  
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new APIError(
      response.status,
      errorData.message || "An error occurred",
      errorData
    );
  }

  const data = await response.json();
  
  // Validate the response data with Zod
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("API Validation Error:", result.error);
    throw new APIError(500, "Invalid response data format", result.error);
  }

  return result.data;
}
