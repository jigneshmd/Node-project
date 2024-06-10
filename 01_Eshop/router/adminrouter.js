const router = require("express").Router();
const admin = require("../model/admins");
const jwt = require("jsonwebtoken");
const aauth = require("../middleware/admin_auth");

router.get("/dashboard", aauth, (req, resp) => {
  resp.render("dashboard");
});

router.get("/adminlogin", (req, resp) => {
  resp.render("adminlogin");
});

router.post("/do_a_login", async (req, resp) => {
  try {
    const Admin = await admin.findOne({ uname: req.body.uname });
    // console.log(Admin);
    if (Admin.pass == req.body.pass) {
      const token = await jwt.sign({ _id: Admin._id }, process.env.A_KEY);
      resp.cookie("ajwt", token);
      resp.render("dashboard");
    } else {
      resp.render("adminlogin", { err: "Plese Enter valid Password" });
    }
  } catch (error) {
    resp.render("adminlogin", { err: "Plese Enter valid Password" });
  }
});

router.get("/admin_logout", aauth, (req, resp) => {
  resp.clearCookie("ajwt");
  resp.render("adminlogin");
});

//---------------------------------------------

router.get("/users", (req, resp) => {
  resp.render("users");
});

router.get("/Orders", (req, resp) => {
  resp.render("Orders");
});

//------------------Catrgory-------------------

const Category = require("../model/categorys");

router.get("/categorys", async (req, resp) => {
  try {
    const catdata = await Category.find();
    resp.render("category", { catdata: catdata });
  } catch (error) {
    console.log(error);
  }
});

router.post("/add_category", aauth, async (req, resp) => {
  try {
    if (req.body.id == "") {
      const cat = new Category(req.body);
      const dt = await cat.save();
      resp.redirect("categorys");
    } else {
      await Category.findByIdAndUpdate(req.body.id, {
        catname: req.body.catname,
      });
      resp.redirect("categorys");
    }
  } catch (error) {
    console.log(error);
  }
});

// ----------Delete Categaroy-----------

router.get("/deletecategory", async (req, resp) => {
  const _id = req.query.cid;
  try {
    await Category.findByIdAndDelete(_id);
    resp.redirect("categorys");
  } catch (error) {
    console.log(error);
  }
});

// --------Edit Category-----------

router.get("/editcategory", async (req, resp) => {
  const _id = req.query.cid;
  try {
    const data = await Category.findOne({ _id: _id });
    const catdata = await Category.find();
    resp.render("category", { edata: data, catdata: catdata });
  } catch (error) {
    console.log(error);
  }
});

// ---------------Product----------------------

const Product = require("../model/products");
const multer = require("multer");
const products = require("../model/products");
const fs = require("fs");

const storageEngine = multer.diskStorage({
  destination: "./public/productimg",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}--${file.originalname}`);
  },
});

const upload = multer({
  storage: storageEngine,
});

router.get("/Products", async (req, resp) => {
  try {
    // const data = await Product.find()
    const data = await Product.aggregate([
      {
        $lookup: {
          from: "categorys",
          localField: "catid",
          foreignField: "_id",
          as: "category",
        },
      },
    ]);
    //    console.log(data[0]);
    const catdata = await Category.find();

    // console.log(catdata)
    resp.render("products", { catdata: catdata, pdata: data });
  } catch (error) {
    console.log(error);
  }
});

router.post("/add_product", upload.single("img"), async (req, resp) => {
  try {
    if (req.body.id == "") {
      const prod = new Product({
        catid: req.body.catid,
        pname: req.body.pname,
        price: req.body.price,
        qty: req.body.qty,
        img: req.file.filename,
      });
      await prod.save();
      // console.log(prod);
      resp.redirect("Products");
    } else {
      await Product.findByIdAndUpdate(req.body.id, {
        catid: req.body.catid,
        pname: req.body.pname,
        price: req.body.price,
        qty: req.body.qty,
        img: req.file.filename,
      });
      resp.redirect("products");
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/deleteproduct", async (req, resp) => {
  try {
    const id = req.query.pid;
    const data = await Product.findByIdAndDelete(id);

    resp.redirect("products");
  } catch (error) {
    console.log(error);
  }
});

router.get("/editproduct", async (req, resp) => {
  try {
    const id = req.query.pid;
    const data = await Product.findOne({ _id: id });
    const catdata = await Category.find();
    const prod = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "catid",
          foreignField: "_id",
          as: "category",
        },
      },
    ]);
    resp.render("products", { edata: data, catdata: catdata, proddata: prod });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
