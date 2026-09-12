/**
 * Standardized API JSON response helpers
 */

export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message,
  };
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

const ERROR_CODE_BY_STATUS = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  501: 'NOT_IMPLEMENTED',
  500: 'INTERNAL_SERVER_ERROR',
};

export const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null, code = null) => {
  const response = {
    success: false,
    code: code || ERROR_CODE_BY_STATUS[statusCode] || 'REQUEST_FAILED',
    message,
  };
  if (errors !== null && errors !== undefined) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

export const sendNotImplemented = (res, featureName = null) => {
  return res.status(501).json({
    success: false,
    code: 'NOT_IMPLEMENTED',
    message: featureName
      ? `Endpoint '${featureName}' is not implemented yet.`
      : 'This endpoint is not implemented yet.',
  });
};
