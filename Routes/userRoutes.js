import sendEmail from "../Controller/mail.js";
import foodModel from "../Model/foodModel.js";
import userModel from "../Model/userModel.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import cron from "node-cron";

cron.schedule("2 16 * * *", () => {
  (async () => {
    try {
      await foodModel.deleteMany({ status: "Expired" });
      // console.log("cycle executed!");
    } catch (error) {
      console.log(error);
    }
  })();
});

const location = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?key=${process.env.LOC_KEY}&q=${latitude}%2C+${longitude}&pretty=1&no_annotations=1`
    );

    if (response) {
      const data = await response.json();
      return res.json({
        status: true,
        loc: data.results[0].formatted,
      });
    } else {
      res.json({
        status: false,
        msg: "something went wrong try adding manual location",
      });
    }
  } catch (e) {
    res.json({
      status: false,
      msg: "something went wrong try adding manual location",
    });
  }
};

const donate = async (req, res) => {
  try {
    const d =
      "https://res.cloudinary.com/dxe8kjakm/image/upload/v1761298069/NGO/zmxkhrhsdrqmcdm2fyo4.png";
    if (req.status) {
      req.body.foodImg = req.file.path;
    } else {
      req.body.foodImg = d;
    }

    const food = await foodModel.create(req.body);
    if (food) {
      await userModel.findOneAndUpdate(
        { email: req.email },
        { $push: { donations: { $each: [food._id], $position: 0 } } }
      );
      return res.json({ status: true });
    }
    res.json({ status: false });
  } catch (err) {
    console.log(err);
    res.json({ status: true });
  }
};

const donations = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.email }).populate({
      path: "donations",
      select:
        "-_id -donorType -donorName -email -phone -physicalAddress -foodCategory -packagingType -tip -foodImg",
      populate: {
        path: "claimer",
        model: "user",
        select: "-_id -password -status -donated -claimed -donations",
      },
    });

    if (user) {
      return res.json({ status: true, data: user.donations });
    }
    res.json({ status: false });
  } catch (error) {
    res.json({ status: false });
  }
};

const foodList = async (req, res) => {
  try {
    const skipFood = (+req.query.page - 1) * 4;
    const filter = req.query.filter == "All" ? "" : req.query.filter;

    const list = await foodModel
      .find({
        ...(req.query.search && {
          $or: [
            { donorName: { $regex: req.query.search, $options: "i" } },
            { physicalAddress: { $regex: req.query.search, $options: "i" } },
            { foodName: { $regex: req.query.search, $options: "i" } },
          ],
        }),
        ...(filter && {
          foodCategory: { $regex: filter, $options: "i" },
        }),
      })
      .skip(skipFood)
      .limit(4)
      .select(
        "-_id -donorType -email -phone -packagingType -tip -claimer -storageRequirement"
      );

    return res.json({ status: true, data: list });
  } catch (error) {
    console.log(error);
    res.json({ status: false });
  }
};

const food = async (req, res) => {
  try {
    const food = await foodModel
      .findOne({ id: req.query.id })
      .select(" -_id -claimer -phone -email");

    if (food) {
      return res.json({ status: true, data: food });
    } else {
      return res.json({ status: false });
    }
  } catch (error) {
    res.json({ status: false });
  }
};

const reserve = async (req, res) => {
  try {
    const food = await foodModel.findOne({ id: req.body.id });
    const user = await userModel.findOne({ email: req.email });
    if (user.email == food.email) return res.json({ status: false });
    if (food && user) {
      user.claimReservation.unshift(food._id);
      await user.save();
      food.status = "Reserved";
      food.claimer = user._id;
      await food.save();
      return res.json({ status: true });
    } else {
      return res.json({ status: false });
    }
  } catch (error) {
    console.log(error);
    res.json({ status: false });
  }
};

const pendingClaim = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.email }).populate({
      path: "claimReservation",
      select: "-_id -donorType -email -packagingType -tip -foodImg -claimer",
    });

    if (food) {
      return res.json({ status: true, data: user.claimReservation });
    } else {
      return res.json({ status: false });
    }
  } catch (error) {
    res.json({ status: false });
  }
};

const cancelClaim = async (req, res) => {
  try {
    const food = await foodModel.findOne({ id: req.body.id });
    const user = await userModel.findOne({ email: req.email });
    if (food && user) {
      user.claimReservation = user.claimReservation.filter(
        (id) => id.toString() !== food._id.toString()
      );
      await user.save();
      food.status = "Active";
      food.claimer = null;
      await food.save();
      return res.json({ status: true });
    } else {
      return res.json({ status: false });
    }
  } catch (error) {
    console.log(error);
    res.json({ status: false });
  }
};

const sendOtp = async (req, res) => {
  try {
    const food = await foodModel.findOne({ id: req.body.id }).populate({
      path: "claimer",
    });
    const user = await userModel.findOne({ email: req.email });

    if (food) {
      if (food.claimer.email == req.email) return res.json({ status: false });
      const n = crypto.randomInt(0, 1_000_000);
      const otp = String(n).padStart(6, "0");

      sendEmail({
        to: food.claimer.email,
        subject: "claim verification otp",
        text: "dont share otp if didn't get the food",
        html: `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Email</title>
    <style>
        .main {
            height: 300px;
            width: 100%;
            padding: 50px 0;
            background-color: black;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
        }

        .heading {
            font-size: large;
            font-weight: 600;
            text-align: center;
            color: white;
            text-align: center;
            padding: 40px 0;
        }

        .otp-container {
            height: 50px;
            width: 50%;
            margin-top: auto;
            background-color: black;
            border: 2px solid orange;
            border-radius: 8px;
            display: inline-block;
        }
    </style>
</head>

<body>
    <div class="main">
        <div class="heading">Don't share OTP until you get the food</div>
        <div class="otp-container">
            <p>OTP: <span style="font-weight: bold; font-size: 18px; color: orange;">${otp}</span></p>
        </div>
    </div>
</body>

</html>`,
      });

      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otp, salt);
      food.otp = hashedOtp;
      await food.save();
      return res.json({ status: true });
    } else {
      return res.json({ status: false });
    }
  } catch (error) {
    console.log(error);
    res.json({ status: false });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const food = await foodModel.findOne({ id: req.body.id }).populate({
      path: "claimer",
    });
    const claimer = await userModel.findOne({ email: food.claimer.email });
    const donor = await userModel.findOne({ email: req.email });

    if (food && claimer && donor) {
      if (claimer.email == donor.email) return res.json({ status: false });

      const isMatch = await bcrypt.compare(req.body.otp, food.otp);

      if (isMatch) {
        await userModel.updateOne(
          { _id: donor._id },
          { $pull: { donations: food._id }, $inc: { donated: 1 } }
        );
        await userModel.updateOne(
          { _id: claimer._id },
          { $pull: { claimReservation: food._id }, $inc: { claimed: 1 } }
        );
        await foodModel.findOneAndDelete({ id: food.id });

        return res.json({ status: true });
      } else {
        return res.json({ status: false });
      }
    } else {
      return res.json({ status: false });
    }
  } catch (error) {
    console.log(error);
    res.json({ status: false });
  }
};

const cancelDonation = async (req, res) => {
  try {
    const food = await foodModel.findOne({ id: req.query.id });
    if (food) {
      if (food.claimer) {
        await userModel.findOneAndUpdate(
          { _id: food.claimer },
          { $pull: { claimReservation: food._id } }
        );
      }

      await userModel.findOneAndUpdate(
        { email: req.email },
        { $pull: { donations: food._id } }
      );
      await foodModel.findOneAndDelete({ id: req.query.id });
      return res.json({ status: true });
    } else {
      return res.json({ status: false });
    }
  } catch (error) {
    console.log(error);
    res.json({ status: false });
  }
};

const editProfile = async (req, res) => {
  try {
    const user = await userModel.findOneAndUpdate(
      { email: req.email },
      { $set: { name: req.body.name, phone: req.body.phone } },
      {
        new: true,
      }
    );
    if (user) {
      return res.json({
        status: true,
        data: { name: user.name, phone: user.phone },
      });
    } else {
      return res.json({ status: false });
    }
  } catch (error) {
    console.log(error);
    res.json({ status: false });
  }
};

export {
  location,
  donate,
  donations,
  foodList,
  food,
  reserve,
  pendingClaim,
  cancelClaim,
  sendOtp,
  verifyOtp,
  cancelDonation,
  editProfile,
};
