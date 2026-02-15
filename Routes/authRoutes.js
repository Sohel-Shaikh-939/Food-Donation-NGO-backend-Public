import sendEmail from "../Controller/mail.js";
import userModel from "../Model/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const signUp = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    
    const token = jwt.sign({ ...req.body }, process.env.JWT_SECRET);

    if (token) {
      await sendEmail({
        to: req.body.email,
        subject: "Welcome to Food4All!",
        text: `Validate your account by clicking on this link http://localhost:3000/validate?token=${token}`,
        html: `<h1 style="text-align: center;">Validate your account by clicking on this link http://localhost:3000/validate?token=${token}</h1>`,
      });
      const user = await userModel.create({
        ...req.body,
        password: hashedPassword,
        status: false,
      }); 
    } else {
      return res.json({ status: false, msg: "Something went wrong!" });
    }

    res.json({
      status: true,
      msg: "Success! Account created verify your account by clicking on the link sent to your email",
    });
  } catch (error) {
    console.log(error)
    if (error.code === 11000)
      return res.json({
        status: false,
        msg: "User already exist please login!",
      });
    res.json({ status: false, msg: "Something went wrong!" });
  }
};

const validate = async (req, res) => {
  try {
    const data = jwt.verify(req.query.token, process.env.JWT_SECRET);
    const user = await userModel.findOne({ email: data.email });

    if (!user)
      return res.send(
        '<h1 style="text-align: center;"> something went wrong! </h1>'
      );

    if (user.status) {
      res.send('<h1 style="text-align: center;"> User already verified </h1>');
    } else {
      user.status = true;
      await user.save();
      res.send(
        '<h1 style="text-align: center;"> User verified successfully </h1>'
      );
    }
  } catch (error) {
    console.log(error);
    res.json({ status: false });
  }
};

const login = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });

    if (!user) return res.json({ status: false, msg: "user does not exist" });

    if (!user.status) {
      return res.json({
        status: false,
        msg: "please verify your account first, by clicking on the link sent to your mail",
      });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (isMatch) {
      const token = jwt.sign(
        { email: req.body.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      res.json({ status: true, msg: "Success, Logged in successfully", token });
    } else {
      res.json({ status: false, msg: "Wrong password!" });
    }
  } catch (error) {
    console.log(error);
    res.json({ status: false, msg: "Something went wrong!" });
  }
};

const auth = async (req, res) => {
  try {
    const token = req.body.token;

    if (token) {
      const data = jwt.verify(token, process.env.JWT_SECRET);

      if (data) {
        const user = await userModel
          .findOne({ email: data.email }, "-_id -password -status -updatedAt");
          // .populate({
          //   path: "donations",
          //   select:
          //     "-_id -donorType -donorName -email -phone -physicalAddress -foodCategory -packagingType -tip -foodImg",
          // });
        return res.json({ status: true, data: user });
      }
    }

    res.json({ status: false });
  } catch (error) {
    res.json({ status: false });
  }
};

const isAuthenticated = async (req, res, next) => {
  try {
    const Authenticated = jwt.verify(
      req.headers.authorization,
      process.env.JWT_SECRET,
      (err, decoded) => {
        if (!err) return decoded;
        return false;
      }
    );

    if (!Authenticated) {
      return res.json({ status: false });
    } else {
      req.email = Authenticated.email;
      next();
    }
  } catch (err) {
    res.json({ staus: false });
  }
};

export { signUp, validate, login, auth, isAuthenticated };
