import { ClassRoom } from "../../models/index.js";
import { escapeRegex } from "../../utils/validators.js";

export const classesRepository = {
    findById: (classId) => ClassRoom.findById(classId).lean(),

    findByIds: (classIds) => ClassRoom.find({ _id: { $in: classIds } }).lean(),

    list: ({ search } = {}) => {
        const filter = {};
        if (search) {
            const pattern = new RegExp(escapeRegex(search), "i");
            filter.$or = [{ name: pattern }, { code: pattern }, { description: pattern }];
        }
        return ClassRoom.find(filter).sort({ name: 1 }).lean();
    },

    create: async (data) => {
        const created = await ClassRoom.create(data);
        return created.toObject();
    },

    update: (classId, data) =>
        ClassRoom.findByIdAndUpdate(classId, data, { returnDocument: "after", runValidators: true }).lean(),

    remove: (classId) => ClassRoom.findByIdAndDelete(classId).lean(),

    touchLastMessage: (classId, date = new Date()) =>
        ClassRoom.updateOne({ _id: classId }, { lastMessageAt: date }),
};
