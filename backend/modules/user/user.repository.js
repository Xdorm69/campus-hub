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

    /** Users with any of these usernames, matched case-insensitively. */
    findByUsernames: (usernames) =>
        User.find({ username: { $in: usernames } })
            .collation({ locale: "en", strength: 2 })
            .select("_id username")
            .lean(),

    create: async (data) => {
        const user = await User.create(data);
        return user.toObject();
    },

    updateById: (id, data) =>
        User.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true }).lean(),
};

export default userRepository;
