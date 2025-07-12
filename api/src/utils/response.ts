import { Response } from "express";
import { ApiResponse } from "../types/api.types";

// Success response builders
export function sendSuccessResponse<T>(
  res: Response,
  data: T,
  message?: string
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  res.json(response);
}

export function sendCreatedResponse<T>(
  res: Response,
  data: T,
  message?: string
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message: message || "Resource created successfully",
  };
  res.status(201).json(response);
}

export function sendUpdatedResponse<T>(
  res: Response,
  data: T,
  message?: string
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message: message || "Resource updated successfully",
  };
  res.json(response);
}

export function sendDeletedResponse(res: Response, message?: string): void {
  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message: message || "Resource deleted successfully",
  };
  res.json(response);
}

// Error response builders
export function sendErrorResponse(
  res: Response,
  statusCode: number,
  error: string
): void {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error,
  };
  res.status(statusCode).json(response);
}

export function sendBadRequestResponse(res: Response, error: string): void {
  sendErrorResponse(res, 400, error);
}

export function sendNotFoundResponse(res: Response, error: string): void {
  sendErrorResponse(res, 404, error);
}

export function sendConflictResponse(res: Response, error: string): void {
  sendErrorResponse(res, 409, error);
}

export function sendInternalServerError(res: Response, error?: string): void {
  sendErrorResponse(res, 500, error || "Internal server error");
}

export function sendExternalApiError(res: Response, error: string): void {
  sendErrorResponse(res, 502, `External API error: ${error}`);
}

export function sendRateLimitError(res: Response): void {
  sendErrorResponse(res, 429, "Rate limit exceeded. Please try again later.");
}

// Pagination response builder
export function sendPaginatedResponse<T>(
  res: Response,
  data: T[],
  total: number,
  limit?: number,
  offset?: number
): void {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    pagination: {
      total,
      count: data.length,
      ...(limit && { limit }),
      ...(offset !== undefined && { offset }),
      ...(limit &&
        offset !== undefined && {
          hasNext: offset + limit < total,
          hasPrev: offset > 0,
        }),
    },
  };
  res.json(response);
}

// Generic error handler for async routes
export function handleAsyncError(fn: Function) {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error: Error) => {
      console.error("Async route error:", error);
      sendInternalServerError(res, error.message);
    });
  };
}

// SportRadar specific error handler
export function handleSportRadarError(error: unknown, res: Response): void {
  console.error("SportRadar API error:", error);

  if (error instanceof Error) {
    if (error.message.includes("rate limit") || error.message.includes("429")) {
      sendRateLimitError(res);
    } else if (
      error.message.includes("404") ||
      error.message.includes("not found")
    ) {
      sendNotFoundResponse(res, "Resource not found in SportRadar API");
    } else if (
      error.message.includes("401") ||
      error.message.includes("unauthorized")
    ) {
      sendErrorResponse(res, 401, "Unauthorized access to SportRadar API");
    } else {
      sendExternalApiError(res, error.message);
    }
  } else {
    sendExternalApiError(res, "Unknown error occurred");
  }
}

// Database error handler
export function handleDatabaseError(error: unknown, res: Response): void {
  console.error("Database error:", error);

  if (error instanceof Error) {
    if (error.message.includes("Unique constraint")) {
      sendConflictResponse(res, "Resource already exists");
    } else if (error.message.includes("Foreign key constraint")) {
      sendBadRequestResponse(res, "Invalid reference to related resource");
    } else if (error.message.includes("Record not found")) {
      sendNotFoundResponse(res, "Record not found");
    } else {
      sendInternalServerError(res, "Database operation failed");
    }
  } else {
    sendInternalServerError(res, "Unknown database error");
  }
}
