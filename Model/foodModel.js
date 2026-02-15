import { uuid } from "uuidv4";
import mongoose from "../Database/db.js";

const foodSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: uuid,
    },
    donorName: {
      type: String,
      required: true,
      trim: true,
    },
    donorType: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    },
    physicalAddress: {
      type: String,
      required: true,
      trim: true,
    },
    foodName: {
      type: String,
      required: true,
      trim: true,
    },
    foodCategory: {
      type: String,
      required: true,
      trim: true,
    },
    storageRequirement: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    packagingType: {
      type: String,
      required: true,
      trim: true,
    },
    tip: {
      type: String,
      required: true,
      trim: true,
    },
    foodImg: {
      type: String,
      default:
        "https://res.cloudinary.com/dxe8kjakm/image/upload/v1761298069/NGO/zmxkhrhsdrqmcdm2fyo4.png",
    },
    status: {
      type: String,
      default: "Active",
    },
    claimed: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    claimer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

const foodModel = mongoose.model("food", foodSchema);

export default foodModel;
