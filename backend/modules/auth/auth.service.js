import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import authRepository from "./auth.repository.js";
import { envConfig } from "../../config/env.js";

import {
    ConflictError,
    UnauthorizedError,
} from "../../utils/ApiError.js";

const authService = {

    async register(userData) {

        const existingUser = await authRepository.findByEmailOrUsername({
            email: userData.email,
            username: userData.username,
        });

        if (existingUser) {

            if (existingUser.email === userData.email) {
                throw new ConflictError("Email is already registered.");
            }

            throw new ConflictError("Username is already taken.");
        }

        const hashedPassword = await bcrypt.hash(
            userData.password,
            Number(envConfig.BCRYPT_ROUNDS) || 10
        );

        const createdUser = await authRepository.create({
            ...userData,
            password: hashedPassword,
        });

        const token = jwt.sign(
            {
                sub: createdUser.id,
                role: createdUser.role,
            },
            envConfig.JWT_SECRET,
            {
                expiresIn: envConfig.JWT_EXPIRES_IN || "1h",
            }
        );

        return {
            user: {
                id: createdUser.id,
                username: createdUser.username,
                email: createdUser.email,
                role: createdUser.role,
                verified: createdUser.verified,
                createdAt: createdUser.createdAt,
            },
            token,
        };
    },

    async login({ email, password }) {

        const user = await authRepository.findByEmail(email);

        if (!user) {
            throw new UnauthorizedError("Invalid email or password.");
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            throw new UnauthorizedError("Invalid email or password.");
        }

        const token = jwt.sign(
            {
                sub: user.id,
                role: user.role,
            },
            envConfig.JWT_SECRET,
            {
                expiresIn: envConfig.JWT_EXPIRES_IN || "1h",
            }
        );

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                verified: user.verified,
            },
            token,
        };
    },

};

export default authService;