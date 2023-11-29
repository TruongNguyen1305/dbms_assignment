import {Router} from "express";
import { PrismaClient } from "@prisma/client";
import {body, validationResult} from "express-validator";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";
import { verifyToken, verifyTokenAndAuthorization } from "../middlewares/auth";
const router = Router();
const db = new PrismaClient()

// @ route    GET api/auth
// @desc      Get logged in user
// @ access   Private
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await db.user.findUnique({
        where: {
            id: req.user.id
        },
    })
    if (!user) {
      return res.status(400).json({ msg: "user doesn't exist" });
    }
    delete user.password;
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route    POST api/auth
// @ desc     authenticate (Login) user & get token
// @ access   Public
router.post(
  "/",
  body("email", "Please include a valid email").isEmail(),
  body("password", "Password is required").exists(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await db.user.findUnique({
        where: {email}
      });

      if (!user) {
        return res.status(400).json({ msg: "Email is invalid" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Password is invalid" });
      }

      const payload = {
        user: {
          id: user.id,
          // only an admin can take CRUD operations to collections & delete any users
          // if not an admin, the user can only make CRUD operations to his/her account
          isAdmin: user.isAdmin,
        },
      };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
          expiresIn: 360000,
        },
        (error, token) => {
          if (error) throw error;
          delete user.password;
          res.json({
            token, user
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @ route    PUT api/auth
// @desc      Update user
// @ access   Private
router.put("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const { password, currentPassword, ...others } = req.body;
    const user = await db.user.findUnique({
        where: {
            id: parseInt(req.params.id),
        }
    });
    let newPassword;
    if (!user) {
      return res.status(404).json({ msg: "user doesn't exist" });
    }
    if (password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Old password isn't correct" });
      }

      let salt = await bcrypt.genSalt(10);
      newPassword = await bcrypt.hash(password, salt);
    }
    const updatedUser = await db.user.update({
        where: {
            id: parseInt(req.params.id)
        },
        data: {
            ...others,
            password: newPassword
        }
    });

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route    DELETE api/auth
// @ desc     Delete user
// @ access   Private
router.delete("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await db.user.delete({
        where: {
            id: parseInt(req.params.id)
        }
    });
    if (!user) {
      return res.status(404).json({ msg: "user doesn't exist" });
    }
    res.status(200).json({ msg: "User is successfully deleted" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "user doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

export default router;