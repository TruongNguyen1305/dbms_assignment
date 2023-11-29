import dotenv from "dotenv";
dotenv.config();

import express from "express";
// import path from "path";
import route from "./routes/index.js";

const app = express();

//Config 
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

// ROUTES
route(app)

// if (process.env.NODE_ENV === 'production') {
//   // Serve static files from the React app
//   app.use(express.static(path.join(__dirname, '/static/build')));

//   // Route all other requests to the React app
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '/static/build/index.html'));
//   });
// }

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
