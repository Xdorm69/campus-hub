import ApiError from "../utils/ApiError.js";

/**
 * Validates `req[source]` against a zod schema.
 *
 * Parsed body replaces `req.body`. Express 5 makes `req.query` read-only, so
 * parsed query/params are exposed on `req.validated[source]` instead.
 *
 * Failures are thrown (not responded to directly) so the error handler can
 * also clean up any files multer already wrote for this request.
 */
export const validate = (schema, source = "body") => {
    return (req, res, next) => {
        const result = schema.safeParse(req[source] ?? {});

        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));

            const error = new ApiError(400, "ZodValidationError", errors[0]?.message ?? "Invalid request");
            error.errors = errors;
            throw error;
        }

        req.validated = { ...req.validated, [source]: result.data };
        if (source === "body") req.body = result.data;

        next();
    };
};
