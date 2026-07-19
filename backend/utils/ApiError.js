import { errorCodes } from "../constants/err.codes.js";

class ApiError extends Error {
    constructor(statusCode, type, message) {
        super(message);

        this.statusCode = statusCode;
        this.type = type;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default ApiError;

class ValidationError extends ApiError {

    constructor(message = "Validation Error") {
        super(errorCodes.VALIDATION_ERROR, "ValidationError", message);
    }

}
class ConflictError extends ApiError {
    constructor(message = "Conflict Error") {
        super(errorCodes.CONFLICT, "ConflictError", message);
    }
}
class NotFoundError extends ApiError {
    constructor(message="Not Found") {
        super(errorCodes.NOT_FOUND, "NotFoundError", message);
    }
}
class UnauthorizedError extends ApiError {
    constructor(message="Unauthorized") {
        super(errorCodes.UNAUTHORIZED, "UnauthorizedError", message);
    }
}
class ForbiddenError extends ApiError {
    constructor(message="Forbidden") {
        super(errorCodes.FORBIDDEN, "ForbiddenError", message);
    }
}
class BadRequestError extends ApiError {
    constructor(message="BadRequest") {
        super(errorCodes.BAD_REQUEST, "BadRequestError", message);
    }
}

export { ValidationError, ConflictError, NotFoundError, UnauthorizedError, ForbiddenError, BadRequestError };
