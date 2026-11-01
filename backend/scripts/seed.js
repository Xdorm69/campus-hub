/**
 * Creates (or promotes) an admin account and a few starter classes.
 *
 *   SEED_ADMIN_EMAIL=you@uni.edu SEED_ADMIN_PASSWORD=secret123 npm run seed
 *
 * Safe to run more than once.
 */
import bcrypt from "bcrypt";
import { envConfig } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { ClassRoom, Membership, User } from "../models/index.js";
import { ROLES } from "../constants/roles.js";
import { logger } from "../utils/logger.js";

const STARTER_CLASSES = [
    { code: "GENERAL", name: "general", description: "Campus-wide announcements and chatter." },
    { code: "CS101", name: "intro-to-programming", description: "CS101 — questions, notes, and study groups." },
    { code: "MATH201", name: "linear-algebra", description: "MATH201 — problem sets and exam prep." },
];

async function seedAdmin() {
    const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;
    const username = process.env.SEED_ADMIN_USERNAME || "admin";

    if (!email || !password) {
        throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to seed an admin.");
    }

    const existing = await User.findOne({ email });
    if (existing) {
        existing.role = ROLES.ADMIN;
        await existing.save();
        logger.info(`Promoted ${email} to admin`);
        return existing;
    }

    const admin = await User.create({
        username,
        email,
        password: await bcrypt.hash(password, envConfig.BCRYPT_ROUNDS),
        role: ROLES.ADMIN,
        verified: true,
    });
    logger.info(`Created admin ${email}`);
    return admin;
}

async function seedClasses(admin) {
    for (const data of STARTER_CLASSES) {
        const classDoc = await ClassRoom.findOneAndUpdate(
            { code: data.code },
            { $setOnInsert: { ...data, createdBy: admin._id } },
            { upsert: true, returnDocument: "after" }
        );

        await Membership.updateOne(
            { user: admin._id, class: classDoc._id },
            { $setOnInsert: { isModerator: true } },
            { upsert: true }
        );
    }
    logger.info(`Ensured ${STARTER_CLASSES.length} starter classes`);
}

try {
    await connectDatabase();
    await Promise.all([User.syncIndexes(), ClassRoom.syncIndexes(), Membership.syncIndexes()]);
    const admin = await seedAdmin();
    await seedClasses(admin);
} catch (error) {
    logger.error({ err: error }, "Seeding failed");
    process.exitCode = 1;
} finally {
    await disconnectDatabase();
}
