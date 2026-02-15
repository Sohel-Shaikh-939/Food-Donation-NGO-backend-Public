import mongoose from "../Database/db.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    status: {
      type: Boolean,
      default: false,
    },
    donated: {
      type: Number,
      default: 0,
      unique: false,
    },
    claimed: {
      type: Number,
      default: 0,
    },
    claimReservation: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "food" }],
    },
    donations: [{ type: mongoose.Schema.Types.ObjectId, ref: "food" }],
  },
  { timestamps: true }
);

const userModel = mongoose.model("user", userSchema);

export default userModel;
