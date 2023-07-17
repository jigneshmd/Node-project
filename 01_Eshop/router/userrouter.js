const router = require("express").Router()
const User = require("../model/users")
const bcrypt= require("bcryptjs")
const Category = require("../model/categorys")
const Product = require("../model/products")
const auth = require("../middleware/auth")
const Razorpay = require("razorpay")
const Order = require ("../model/orders")

router.get("/",async(req,resp)=>{
    try {
        const catdata = await Category.find()
        const prodata = await Product.find();
        resp.render("index",{catdata:catdata,prodata:prodata})
    } catch (error) {
        console.log(error);
    }
})

router.get("/contact",(req,resp)=>{
    resp.render("contact")
})



router.get("/shop",async(req,resp)=>{
    try {
        const catdata = await Category.find()
        // console.log(catdata);
        resp.render("shop",{catdata:catdata})
    } catch (error) {
        
    }
    
})

router.get("/Login",(req,resp)=>{
    resp.render("Login")
})

router.post("/do_login",async(req,resp)=>{
    try {
        const user = await User.findOne({email:req.body.email})
        const isv = await bcrypt.compare(req.body.pass,user.pass)
        if (isv) {
            const token = await user.generateToken()
            resp.cookie("jwt",token)
            resp.redirect("/")
        } else {
            resp.render("Login",{err:"invalid credentials"})
        }
    } catch (error) {
        resp.render("Login",{err:"invalid credentials"})
    }
})


router.get("/Register",(req,resp)=>{
    resp.render("Register")
})

router.post("/do_registration",async(req,resp)=>{
    // console.log("hello");
    try {
         const data = new User(req.body)
         await data.save();
        //  console.log(data);
        //   const insertdata = await data.save()
        //   console.log(insertdata);
         resp.render("Register",{msg:"register successfull!"})
    } catch (error) {
        console.log(error);
    }
})

router.get("/details",async(req,resp)=>{
    const pid = req.query.pid
    // console.log(pid);
    try {
        const pdata = await Product.findOne({_id:pid})
        resp.render("product-details",{pdata:pdata})
    } catch (error) {
        console.log(error);
    }
})

// ----------------Carts--------------

const Cart = require("../model/carts")


router.get("/add_cart",auth,async(req,resp)=>{
     
    const uid = req.user._id
    const pid = req.query.pid

    try {
        
        const data = await Cart.findOne({pid:pid})
        if(data){
            var qty = data.qty;
            qty++;
            var price = data.price * qty
            await Cart.findByIdAndUpdate(data._id,{qty:qty,total:price});
            resp.send("Product added into cart !!!")
        }
        else
        {
        const pdata = await Product.findOne({_id:pid})
        const cart = new Cart({
            uid:uid,
            pid:pid,
            price:pdata.price,
            qty:1,
            total:pdata.price})
        await cart.save()
        // resp.redirect("/")
        resp.send("product added into cart !!!")
        }
    } catch (error) {
        console.log(error);
    }
})

router.get("/shop_cart",auth,async (req,resp)=>{

    const user = req.user
    try {
        
        const cartdata =await Cart.aggregate([{$match:{uid:user._id}},{$lookup:{from:'products',localField:'pid',foreignField:'_id',as:'product'}}]) 
       
        var sum=0;
        for(var i=0;i<cartdata.length;i++)
        {
            sum = sum + cartdata[i].total
        }


        resp.render("shop_cart",{currentuser : user.uname ,cartdata:cartdata,total:sum})
    }
    catch (error) {
        console.log(error);
    }
})

router.get("/removefromcart",auth,async(req,resp)=>{
    try{
        const cid = req.query.pid
        // console.log(cid);
        await Cart.findByIdAndDelete(cid)

        resp.send()

    }catch(err){
        console.log(err);
    }
})

router.get("/changeqty",auth,async(req,resp)=>{
    try {
            const cid = req.query.cid
            const value = req.query.value

            const cartdata = await Cart.findOne({_id:cid})
            var qty = cartdata.qty+Number(value)
            if(qty!=0)
            {  
            var price = cartdata.price*qty
            await Cart.findByIdAndUpdate(cid,{qty : qty,total:price})
            resp.send("Updated")
            }
            else
            {
                resp.send("")
            }
    } catch (error) {
        console.log(error);
    }
})

// ------------Payment------------------

var nodemailer = require("nodemailer")
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'jigneshdankhara82@gmail.com',
      pass: 'fotkxzqhqghueehi'
    }
  });
  
router.get("/payment",(req,resp)=>{
    const amt = req.query.amt;
    var instance = new Razorpay({
        key_id: 'rzp_test_pTpX66PCviz2tv',
        key_secret: 'JW6KDRRY7U0Uw7GWIOAgBi2M',
         });

        var options = {
            amount: Number(amt)*100,  // amount in the smallest currency unit
            currency: "INR",
            receipt: "order_rcptid_11"
          };

          instance.orders.create(options, function(err, order) {
            // console.log(order);
            resp.send(order)
          });
})

router.get("/confirmOrder",auth,async(req,resp)=>{
    try {
        const payid = req.query.pid
        const uid = req.user._id

        const cartproduct = await Cart.find({uid:uid})
        var productlist = [];
        var alltotal = 0;
        var row = "";

        for(var i = 0; i < cartproduct.length; i++)
        {
            const prod = await Product.findOne({_id:cartproduct[i].pid})
// console.log(prod);
            var pname = prod.pname
            var price = prod.price
            var qty = cartproduct[i].qty
            var total = Number(price)*Number(qty)

            productlist[i]={
                pname:pname,
                price:price,
                qty:qty,
                total:total
            }
            alltotal = alltotal+total;
            row = row+"<tr><td>"+pname+"</td><td>"+price+"</td><td>"+qty+"</td><td>"+total+"</td></tr>"
        }

        const order = new Order({payid:payid,uid:uid,product:productlist,total:alltotal})
        await order.save ()

        var mailOptions = {
            from: 'jigneshdankhara82@gmail.com',
            to: req.user.email,
            subject: 'Order Conformation',
            html: "<table border='1'><tr><th>ProductName</th><th>Price</th><th>qty</th><th>Total</th></tr>"+row+"<tr><td>All total</td><td>"+alltotal+"</td></tr></table>"
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
                resp.send("Order confirmed !!!")
            }
          });


    } catch (error) {
        console.log(error);
    }
})


module.exports=router