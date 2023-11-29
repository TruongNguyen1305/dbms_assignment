import {Router} from "express"
import {body, validationResult} from "express-validator";
import { PrismaClient, Prisma } from "@prisma/client";
import { verifyTokenAndAdmin, verifyTokenAndAuthorization, verifyToken } from "../middlewares/auth";
const router = Router();
const db = new PrismaClient();

// @ route GET api/cart
// @ desc  Get carts of all user
// @ access Private
router.get("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    const carts = await db.cart.findMany();
    res.status(200).json(carts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// @ route GET api/cart
// @ desc  Get user cart
// @ access Private
router.get("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    let cart = await db.cart.findFirst({
        where: {
          id: parseInt(req.params.id)
        },
        include: {
          details: {
            include: {
              product: true
            }
          }
        }
    });

    if(!cart) {
      return res.status(200).json(null);
    }

    return res.status(200).json({
      id: cart.id,
      products: cart.details ? cart.details.map(detail => ({
          id: detail.productId,
          quantity: detail.quantity,
          itemTotal: detail.itemTotal,
          product: {
              ...detail.product,
              img: detail.product.img.split(","),
              categories: [{
                  color: detail.product.color.split(","),
                  gender: detail.product.gender.split(","),
              }],
              size: detail.product.size.split(",")
          }
      })) : []
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// @ route POST api/cart
// @ desc  Create new cart
// @ access Private
router.post(
  "/",
  verifyToken,
  // body("userId", "Please enter a user id").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    console.log(req.body)

    try {
      let cart = await db.cart.create({
        data: {
            id: req.body.id,
            details: {
              create: req.body.products.map(product => ({
                itemTotal: product.itemTotal,
                quantity: product.quantity,
                productId: product.id
              })),
            }
        },
        include: {
          details: {
              include: {
                product: true
              }
          }
        }
      });

      console.log(cart)

      res.status(200).json({
        id: cart.id,
        products: cart.details.map(detail => ({
            id: detail.productId,
            quantity: detail.quantity,
            itemTotal: detail.itemTotal,
            product: {
                ...detail.product,
                img: detail.product.img.split(","),
                categories: [{
                    color: detail.product.color.split(","),
                    gender: detail.product.gender.split(","),
                }],
                size: detail.product.size.split(",")
            }
        }))
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @ route    PUT api/cart
// @desc      Update cart
// @ access   Private
router.put("/:id", verifyTokenAndAuthorization , async (req, res) => {
  try {
    const updatedCart = await db.cart.update({
      where: {
        id: parseInt(req.params.id)
      },
      data: {
        details: {
          deleteMany: {},
          createMany: {
            data: req.body.products.map(product => ({
              // cartId: parseInt(req.params.id),
              productId: product.id,
              quantity: product.quantity,
              itemTotal: product.itemTotal
            }))
          }
        }
      },
      include: {
        details: {
          include: {
            product: true
          }
        }
      }
    })

    // const res = await db.$queryRaw`
    //   SELECT * FROM Detail WHERE cartId = ${parseInt(req.params.id)} and productId in (${Prisma.join(productIds)});
    // `

    

    res.status(200).json({
      id: updatedCart.id,
      products: updatedCart.details.map(detail => ({
          id: detail.productId,
          quantity: detail.quantity,
          itemTotal: detail.itemTotal,
          product: {
              ...detail.product,
              img: detail.product.img.split(","),
              categories: [{
                  color: detail.product.color.split(","),
                  gender: detail.product.gender.split(","),
              }],
              size: detail.product.size.split(",")
          }
      }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route    DELETE api/cart
// @ desc     Delete cart
// @ access   Private
router.delete("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const cart = await db.cart.delete({
        where: {id: parseInt(req.params.id)},
    })
    if(!cart) {
        return res.status(404).json({ msg: "cart doesn't exist" });
    }
    res.status(200).json({ msg: "cart is successfully deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

export default router;