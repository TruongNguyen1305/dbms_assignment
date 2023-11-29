import {Router} from "express";
import { verifyTokenAndAdmin } from "../middlewares/auth";
import { PrismaClient } from "@prisma/client";
import {body, validationResult} from "express-validator";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";
const router = Router();
const db = new PrismaClient()

// @ route GET api/user
// @ desc  Get registered user
// @ access Private
router.get("/find/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const user = await db.user.findFirst({
        where: {
            id: parseInt(req.params.id)
        },
    });
    
    if(!user) {
        return res.status(400).json({ msg: "user doesn't exist" });
    }

    delete user.password;

    res.status(200).json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/user
// @ desc  Get registered user
// @ access Private
router.get("/", verifyTokenAndAdmin, async (req, res) => {
  const query = req.query.new;
  try {
    const users = query
      ? await db.user.findMany({
        orderBy: {
            id: 'desc'
        },
        take: 5
      })
      : await db.user.findMany();
    res.status(200).json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/user/stats
// @ desc  Get total number of users per month
// @ access Private
router.get("/stats", verifyTokenAndAdmin, async (req, res) => {
  const date = new Date();
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));
  try {
    
    const data = await db.$queryRaw`
        select Temp.m as id, count(*) as total
        from (SELECT MONTH(createdAt) as m FROM User WHERE createdAt >= ${lastYear.toISOString()}) as Temp
        group by Temp.m;
    `
    res.status(200).json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route POST api/user
// @ desc  Register user
// @ access Public
router.post(
  "/",
  body("username", "Please enter a username").not().isEmpty(),
  body("email", "Please include a valid email").isEmail(),
  body(
    "password",
    "Please password shouldnt be less than 6 characters"
  ).isLength({ min: 5 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstname, lastname, username, email, password } = req.body;

    try {
      let user = await db.user.findUnique({
        where: {
            email
        }
      });

      if (user) {
        return res.status(400).send("User already exists");
      }


      let salt = await bcrypt.genSalt(10);
      let hash = await bcrypt.hash(password, salt);

      const newUser = await db.user.create({
        data: {
            firstname,
            lastname,
            username,
            email,
            password: hash
        }
      })

      const payload = {
        user: {
          id: newUser.id,
          // only an admin can take CRUD operations to collections & delete any users
          // if not an admin, the user can only make CRUD operations to his/her account
          isAdmin: newUser.isAdmin,
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
          res.status(201).json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

export default router;