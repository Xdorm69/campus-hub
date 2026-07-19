import { Prisma } from "@prisma/client";
import ApiError from "./ApiError.js";

export function handlePrismaError(error) {

    if (error instanceof Prisma.PrismaClientKnownRequestError) {

        switch (error.code) {

            // Unique constraint
            case "P2002": {
                const fields = error.meta?.target ?? [];
                const fieldNames = Array.isArray(fields)
                    ? fields.join(", ")
                    : fields;

                throw new ApiError(
                    409,
                    "PrismaConflictError",
                    `${fieldNames} already exists`
                );
            }

            // Foreign key
            case "P2003": {
                const field = error.meta?.field_name ?? "relation";

                throw new ApiError(
                    400,
                    "PrismaForeignKeyError",
                    `Invalid ${field}`
                );
            }

            // Record not found
            case "P2025":
                throw new ApiError(
                    404,
                    "PrismaNotFoundError",
                    "Requested resource does not exist"
                );

            // Required relation
            case "P2014":
                throw new ApiError(
                    400,
                    "PrismaRelationError",
                    "Operation would violate required relation"
                );

            // Value too long
            case "P2000": {
                const column = error.meta?.column_name ?? "field";

                throw new ApiError(
                    400,
                    "PrismaValidationError",
                    `${column} value is too long`
                );
            }

            // Null constraint
            case "P2011": {
                const constraint = error.meta?.constraint ?? "field";

                throw new ApiError(
                    400,
                    "PrismaValidationError",
                    `${constraint} cannot be null`
                );
            }

            default:
                throw new ApiError(
                    500,
                    "PrismaDatabaseError",
                    error.message
                );
        }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {

        const message = error.message
            .replace(/\n/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        throw new ApiError(
            400,
            "PrismaValidationError",
            message
        );
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
        throw new ApiError(
            500,
            "PrismaInitializationError",
            "Could not connect to the database"
        );
    }

    if (error instanceof Prisma.PrismaClientRustPanicError) {
        throw new ApiError(
            500,
            "PrismaInternalError",
            "Database engine crashed"
        );
    }

    throw error;
}