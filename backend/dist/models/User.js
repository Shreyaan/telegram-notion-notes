"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UserSchema = new mongoose_1.default.Schema({
    telegramId: {
        type: String,
        required: true,
        unique: true,
    },
    token: {
        type: String,
        required: false,
        unique: false,
    },
    isPremium: {
        type: Boolean,
        required: true,
        default: false,
    },
    numberOfUses: {
        type: Number,
        required: true,
        default: 0,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
    },
});
exports.default = mongoose_1.default.model("User", UserSchema);
//# sourceMappingURL=User.js.map