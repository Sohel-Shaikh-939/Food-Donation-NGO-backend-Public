import "dotenv/config";
import express from "express";
import cors from "cors";
import uuidv4 from "uuidv4";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { auth, isAuthenticated, login, signUp, validate } from "./Routes/authRoutes.js";
import { cancelClaim, cancelDonation, donate, donations, editProfile, food, foodList, location, pendingClaim, reserve, sendOtp, verifyOtp } from "./Routes/userRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 3000;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    req.status = true;
    cb(null, true); 
  } else {
    req.status = false;
    cb(null, false); 
  }
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "NGO",
  },
});

const upload = multer({ storage, fileFilter });

app.post("/signup",signUp);
app.post("/login",login);
app.post("/auth",auth);
app.post("/location",location);
app.post("/donate", isAuthenticated,upload.single("foodImg"), donate);
app.post("/reserve", isAuthenticated, reserve);
app.post("/sendotp", isAuthenticated, sendOtp);
app.post("/verifyotp", isAuthenticated, verifyOtp);
app.get("/validate",validate);
app.get("/donations", isAuthenticated, donations);
app.get("/pendingclaim", isAuthenticated, pendingClaim);
app.get("/foodlist", foodList);
app.get("/food", food);
app.patch("/cancelclaim", isAuthenticated, cancelClaim);
app.patch("/editprofile", isAuthenticated, editProfile);
app.delete("/canceldonation",isAuthenticated, cancelDonation);


app.listen(port, () => {
  console.log("Server started on port ", port);
});