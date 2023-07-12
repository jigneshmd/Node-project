const router = require("express").Router()
const User = require("../model/users")
const bcrypt= require("bcryptjs")
const Category = require("../model/categorys")
const Product = require("../model/products")
const auth = require("../middleware/auth")

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


        resp.render("shop_cart",{cartdata:cartdata,total:sum})
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


module.exports=router