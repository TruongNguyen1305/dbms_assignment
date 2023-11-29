import {Router} from "express";
import {body, validationResult} from "express-validator";
import { PrismaClient } from "@prisma/client";
import { verifyTokenAndAdmin } from "../middlewares/auth";
const router = Router();
const db = new PrismaClient();

// @ route GET api/products
// @ desc  Get all products
// @ access Private
router.get("/",  async (req, res) => {
  const queryNew = req.query.new;
  const queryCollections = req.query.collection;
  try {
    let products;
    if (queryNew) {
        products = await db.product.findMany({
            orderBy: {
                id: 'desc'
            },
            take: 5
        });
    }
    if (queryCollections) {
        products = await db.product.findMany({
            where: {
                company: {
                    in : [queryCollections]
                }
            }
        });
    } else {
        products = await db.product.findMany();
    }
    res.status(200).json(products.map(product => ({
        ...product,
        img: product.img.split(","),
        categories: [{
            color: product.color.split(","),
            gender: product.gender.split(","),
        }],
        size: product.size.split(",")
    })));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route GET api/products
// @ desc  Get product
// @ access Private
router.get("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const product = await db.product.findUnique({
        where: {
            id: parseInt(req.params.id)
        }
    });

    if(!product) {
        return res.status(400).json({ msg: "product doesn't exist" });
    }

    res.status(200).json({
        ...product,
        img: product.img.split(","),
        categories: [{
            color: product.color.split(","),
            gender: product.gender.split(","),
        }],
        size: product.size.split(",")
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route POST api/products
// @ desc  Create new product
// @ access Private
router.post(
  "/",
  verifyTokenAndAdmin,
  body("company", "Please enter a company name").not().isEmpty(),
  body("title", "Please enter a title").not().isEmpty(),
  body("desc", "Please enter a description").not().isEmpty(),
  body("img", "Please enter an image url").not().isEmpty(),
  body("price", "Please enter a price").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // CREATE A NEW PRODUCT
      let product = await db.product.create({
        data: req.body
      });

      res.status(201).json({
        ...product,
        img: product.img.split(","),
        categories: [{
            color: product.color.split(","),
            gender: product.gender.split(","),
        }],
        size: product.size.split(",")
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @ route    PUT api/product
// @desc      Update product
// @ access   Private
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const product = await db.product.findUnique({
        where: {id: parseInt(req.params.id)},
    });

    if(!product) {
        return res.status(404).json({ msg: "product doesn't exist" });
    } 

    const updatedProduct = await db.product.update({
        where: {id: parseInt(req.params.id)},
        data: req.body
    });

    res.status(200).json({
         ...updatedProduct,
        img: updatedProduct.img.split(","),
        categories: [{
            color: updatedProduct.color.split(","),
            gender: updatedProduct.gender.split(","),
        }],
        size: updatedProduct.size.split(",")
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @ route    DELETE api/auth
// @ desc     Delete product
// @ access   Private
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const product = await db.product.delete({
        where: {id: parseInt(req.params.id)},
    });
    if (!product) return res.status(404).json({ msg: "product doesn't exist" });
    res.status(200).json({ msg: "Product is successfully deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

export default router;