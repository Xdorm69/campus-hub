import { ForbiddenError, UnauthorizedError } from "../utils/ApiError.js";

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new UnauthorizedError("Authentication required");
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new ForbiddenError("You don't have permission to do that");
        }

        next();
    };
};

export default authorize;
