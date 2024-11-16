import mongoose, {Schema} from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
            minLength: [5, "Username is should not be less than 5 characters"],
            maxLength: [15, "Username should not exceed 15 characters"],
            // match: [
            //     [/^[a-zA-Z0-9_]{5,15}$/, "Username can only contain letters, numbers, and underscores"],
            //     [/^((?!__)[a-zA-Z0-9_]{5,15})$/, "Username cannot contain consecutive underscores"],
            //     [/^[a-zA-Z0-9][a-zA-Z0-9_]{4,14}[a-zA-Z0-9]$/, "Username cannot start or end with an underscore"]
            // ]
        },

        password: {
            type: String,
            required: true,
            minLength: [8, "Password must be at least 8 characters long"],
            maxLength: [99, "Password should not exceed 99 characters"],
            // match: [/^(?=.*[a-z])(?=.*\d)[A-Za-z\d]{8,99}$/,
                // "Password must be at least 8 characters long and contain at least one lowercase letter and one digit"]
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            // match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email address"]
        },

        fullName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,

        },

        avatar: {
            type: String,  //cloudinary
            required: true,
        },

        coverImage: {
            type: String, //cloudinary

        },

        refreshToken: {
            type: String
        },

        watchHistory:[ {
            type: Schema.Types.ObjectId,
            ref: "Videos"
        }]

    }, { timestamps: true }
);



userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        this.password = await bcrypt.hash(this.password, 10)
        next();
    }
    catch (error) {
        next(error);
    }
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName,
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
};


userSchema.methods.generateRefreshTokens = function () {
    return jwt.sign({
        _id: this.id,
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model("User", userSchema);
export { User }