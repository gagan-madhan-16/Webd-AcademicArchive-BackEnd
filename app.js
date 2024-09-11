require("dotenv").config();
const express = require("express");
const app = express();
const router = require("./router");
const cloudinary = require("cloudinary");
const cors = require("cors");



app.use(cors());

app.use(express.json());

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

app.use("/GDSC/backend/app", router);

const port = process.env.PORT;

app.listen(port,()=>{
  console.log(`running on port ${port}`);
});
