import {PrismaClient} from "@prisma/client";
import bcrypt from "bcryptjs"
import data from "./seed-data.json" assert {type: 'json'};

const db = new PrismaClient();

async function main() {
    //Clear data
    await db.address.deleteMany({});
    await db.cart.deleteMany({});
    await db.order.deleteMany({});
    await db.product.deleteMany({});
    await db.user.deleteMany({});

    const {admin, products} = data

    const salt = await bcrypt.genSalt(10);
    admin.data.password = await bcrypt.hash(admin.data.password, salt);
    
    await db.user.create(admin);
    await db.product.createMany(products);

    console.log("Seed done!")
}
main()
    .catch(async (e) => {
        console.error(e)
        // process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })