import { Request, Response, NextFunction } from "express";

/**
 * 404 Handler
 * Catches any HTTP requests that don't match our defined routes.
 * Instead of Express sending an HTML page "Cannot GET /...", it sends clean JSON.
 */
export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route Not Found: ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass this error straight down to the global error handler below
};

/**
 * Global Exception Handler
 * This is the equivalent of .NET's top-level ExceptionFilter.
 * It catches BOTH the 404 error above AND any actual code crashes.
 */
// Express recognizes this as an error handler STRICTLY because it has 4 arguments!
export const globalErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  // If the status code was never set, default to 500 (Internal Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Log the crash for our internal debugging (you could also send this to Datadog/Application Insights)
  console.error(`[ERROR] ${err.message}`);

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Provide the exact file/line number stack trace ONLY if we are in Development!
    // In .NET this is like setting IncludeExceptionDetailInFaults
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
