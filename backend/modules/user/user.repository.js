import { User } from "../../models/index.js";

const userRepository = {
    findById: (id) => User.findById(id).lean(),

    findByEmail: (email, { withPassword = false } = {}) => {
        const query = User.findOne({ email });
        if (withPassword) query.select("+password");
        return query.lean();
    },

    findByEmailOrUsername: ({ email, username }) =>
        User.findOne({ $or: [{ email }, { username }] }).lean(),

    findByUsername: (username) => User.findOne({ username }).lean(),

    create: async (data) => {
        const user = await User.create(data);
        return user.toObject();
    },

    updateById: (id, data) =>
        User.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true }).lean(),
};

export default userRepository;
