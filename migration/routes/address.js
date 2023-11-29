import {Router} from "express";
import { PrismaClient } from "@prisma/client";
import {body, validationResult} from "express-validator";
import { verifyTokenAndAdmin, verifyTokenAndAuthorization, verifyTokenAndUser, verifyToken, } from "../middlewares/auth";
const router = Router();
const db = new PrismaClient();

// @ route GET api/address
// @ desc  Get addresses of all user
// @ access Private
router.get("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    const addresses = await db.address.findMany();
    res.status(200).json(addresses.map(address => ({
      user: address.userId,
      ...address
    })));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/address
// @ desc  Get user address
// @ access Private
router.get("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const addresses= await db.address.findMany({
        where: {userId}
    })
    
    res.status(200).json(addresses.map(address => ({
      user: address.userId,
      ...address
    })));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// @ route POST api/address
// @ desc  Create new address
// @ access Private
router.post(
  "/",
  verifyToken,
  body("firstname", "Please enter firstname").not().isEmpty(),
  body("lastname", "Please enter lastname").not().isEmpty(),
  body("phone", "Please enter phone not").not().isEmpty(),
  body("streetAddress", "Please enter the street address").not().isEmpty(),
  body("city", "Please enter city").not().isEmpty(),
  body("state", "Please enter state").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.body.user;
      delete req.body.user;
      let address = await db.address.create({
        data: {
          userId,
          ...req.body
        }
      });
      res.status(200).json({
        user: address.userId,
        ...address
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @ route    PUT api/address
// @desc      Update address
// @ access   Private
router.put("/:id", verifyTokenAndUser , async (req, res) => {
  try {
    const updatedAddress = await db.address.update({
      where: {
        id: parseInt(req.params.id)
      },
      data: req.body
    });
    res.status(200).json(updatedAddress);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// @ route    PUT api/address/default/id
// @desc      Set checked address
// @ access   Private
router.put("/default/:id", verifyToken, async (req, res) => {
  try {
    // ALL THE USER ADDRESSES
    const addresses = await db.address.findMany({ 
      where: {
        userId: req.body.user
      }
    });

    const { checked } = req.body
    addresses.forEach(async (userAddress) => {
      // IF NOT THE CHECKED ONE, SET TO FALSE
      await db.address.update({
        where: {
          id: userAddress.id !== parseInt(req.params.id) ? userAddress.id : parseInt(req.params.id)
        },
        data: {
          checked: userAddress.id !== parseInt(req.params.id) ? false : true
        }
      })
    })

    let updatedAddress = await db.address.findMany({
      where: {
        userId: req.body.user
      }
    })

    // addresses.markModified('checked')
    // await addresses.save()

    res.status(200).json(updatedAddress);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "address doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }


});

// @ route    DELETE api/address
// @ desc     Delete address
// @ access   Private
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await db.address.delete({
      where: {
        id: parseInt(req.params.id)
      }
    });

    res.status(200).json({ msg: "address is successfully deleted" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "address doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

export default router;