import authRouter from "./auth";
import userRouter from "./user";
import productRouter from "./product";
import cartRouter from "./cart";
import orderRouter from "./order";
import addressRouter from "./address";

const route = (app) => {
    app.use("/api/auth", authRouter);
    app.use("/api/users", userRouter);
    app.use("/api/products", productRouter);
    app.use("/api/cart", cartRouter);
    app.use("/api/orders", orderRouter);
    app.use("/api/address", addressRouter);
    // app.use("", require("./routes/stripe"));
}

export default route