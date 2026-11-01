import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { envConfig } from "../../config/env.js";
import { ConflictError, UnauthorizedError } from "../../utils/ApiError.js";
import userRepository from "../user/user.repository.js";
import { toUserDTO } from "../user/user.mapper.js";

function issueToken(user) {
    return jwt.sign({ sub: String(user._id), role: user.role }, envConfig.JWT_SECRET, {
        expiresIn: envConfig.JWT_EXPIRES_IN_HOURS * 60 * 60,
    });
}

const authService = {
    async register({ username, email, password }) {
        const existingUser = await userRepository.findByEmailOrUsername({ email, username });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new ConflictError("Email is already registered.");
            }
            throw new ConflictError("Username is already taken.");
        }

        const hashedPassword = await bcrypt.hash(password, envConfig.BCRYPT_ROUNDS);
        const user = await userRepository.create({ username, email, password: hashedPassword });

        return {
            user: toUserDTO(user, { includePrivate: true }),
            token: issueToken(user),
        };
    },

    async login({ email, password }) {
        const user = await userRepository.findByEmail(email, { withPassword: true });

        // Same message for both cases so the endpoint can't be used to
        // discover which emails are registered.
        const isPasswordValid = user && (await bcrypt.compare(password, user.password));
        if (!isPasswordValid) {
            throw new UnauthorizedError("Invalid email or password.");
        }

        return {
            user: toUserDTO(user, { includePrivate: true }),
            token: issueToken(user),
        };
    },
};

export default authService;
