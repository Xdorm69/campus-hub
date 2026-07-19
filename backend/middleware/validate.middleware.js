export const validate = (schema) => {

    return (req, res, next) => {
        req.log.debug("Validating request body", { body: req.body });

        if (!req.body) {
            req.log.warn("Request body missing");

            return res.status(400).json({
                success: false,
                type: "ValidationError",
                message: "Request body is required"
            });
        }

        const result = schema.safeParse(req.body);

        if (!result.success) {

            
            const errors = result.error.issues.map(issue => ({
                field: issue.path.join("."),
                message: issue.message,
            }));
            
            req.log.error({ errors });

            return res.status(400).json({
                success: false,
                type: "ZodValidationError",
                errors
            });

        }

        req.body = result.data;

        next();

    };

};