const jwt = require("jsonwebtoken")
const User = require("../model/users")

const auth = async(req,resp,next)=>{  
const token = req.cookies.jwt
// console.log(token);

try {
    const data = await jwt.verify(token,process.env.S_KEY)
    // console.log(data);
    if(data)
    {
     const user = await User.findOne({_id:data._id})
        // console.log(user);

    const dt = user.Tokens.find(ele=>{
        return ele.token=token
     })
    //  console.log("ok "+dt);

     if(dt==undefined)
     {
        resp.render("login",{err : "please login first"})
     }
     else
    {
     req.user = user;
     req.token = token
     next()
    }
    }else
    {
        resp.render("login",{err : "please login first"})
    }
}catch (error) {
        resp.render("login",{err : "please login first"})
    }
   
}
module.exports=auth

