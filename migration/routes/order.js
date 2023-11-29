import {Router} from "express";
import { PrismaClient } from "@prisma/client";
import {body, validationResult} from "express-validator";
import { verifyTokenAndAdmin, verifyTokenAndAuthorization, verifyToken, } from "../middlewares/auth";
const router = Router();
const db = new PrismaClient();

// @ route GET api/order
// @ desc  Get orders of all user
// @ access Private
router.get("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    const orders = await db.order.findMany();
    res.status(200).json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/order
// @ desc  Get user orders
// @ access Private
router.get("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const orders = await db.order.findMany({ 
        where: {
            userId: parseInt(req.params.id)
        },
        include: {
            address: true,
            details: {
                include: {
                    product: true
                }
            }
        }
     });
    res.status(200).json(orders.map(order => ({
        ...order,
        user: order.userId,
        products: order.details.map(detail => ({
            id: detail.productId,
            product: {
                ...detail.product,
                img: detail.product.img.split(',')
            },
            quantity: detail.quantity,
            itemTotal: detail.itemTotal
        }))
    })));
  } catch (err) {
    res.status(500).send("Server Error");
  }
});


// @ route POST api/order
// @ desc  Create new order
// @ access Private
router.post(
  "/",
  verifyToken,
  body("user", "Please enter a user id").not().isEmpty(),
  body("products", "Please enter atleast one product").not().isEmpty(),
  body("amount", "Please enter its amount").not().isEmpty(),
  body("address", "Please enter the address").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
        let cart = await db.cart.findUnique({
            where: {
                id: req.body.user
            },
            include: {
                details: true
            }
        });

        const ids = cart.details.map(detail => ({id: detail.id}))

        const updatedCart = await db.cart.update({
            where: {
                id: req.body.user
            },
            data: {
                details: {
                    disconnect: ids
                }
            },
            include: {
                details: true
            }
        })

        console.log(updatedCart)
        
        let newOrder = await db.order.create({
            data: {
                userId: req.body.user,
                amount: req.body.amount,
                details: {
                    connect: ids
                },
                addressId: req.body.address.id
            },
        });

    //   let newOrder = await order.save();

      res.status(201).json({
        ...newOrder,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @ route    PUT api/order
// @desc      Update order
// @ access   Private
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const updatedOrder = await db.order.update({
        where: {
            id: parseInt(req.params.id)
        },
        data: req.body
    })
    res.status(200).json(updatedOrder);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ msg: "Order doesn't exist" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route    DELETE api/order
// @ desc     Delete order
// @ access   Private
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    await db.order.delete({
        where: {
            id: parseInt(req.params.id)
        }
    });
    res.status(200).json({ msg: "order is successfully deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

export default router;