const jwt = require("jsonwebtoken")
const Admin = require("../model/admins")


const aauth = async(req,resp,next)=>{

    const token = req.cookies.ajwt
    try {     
        const data = await jwt.verify(token,process.env.A_KEY)
        if (data) 
        {
            const admin = await Admin.findOne({_id:data._id})
            // console.log(admin);    
            req.admin = admin;
            req.token = token
            next()
        } 
        else 
        {
            resp.render("adminlogin",{err:"Please login first!!!"})
        }
    } catch (error) {
        resp.render("adminlogin",{err:"please login first!!!"}) 
    }
}



module.exports=aauth