const express = require("express")
const app = express()
require("dotenv").config()
const mongoose = require("mongoose")
const hbs = require("hbs")
const path = require("path") 
const bodyparser = require("body-parser")
var cookieParser = require('cookie-parser')
var cors = require("cors")
app.use(cors())


const PORT = process.env.PORT
const url = process.env.DB_URL



mongoose.connect(url).then(()=>{
    console.log("DB Conected");
})

app.use(cookieParser())
app.use(bodyparser.urlencoded({extended:false}))
const publicpath = path.join(__dirname,"../public")
const viewpath = path.join(__dirname,"../templetes/views")
const partialpath = path.join(__dirname,"../templetes/partials")



app.set ("view engine","hbs")
app.set ("views",viewpath)
hbs.registerPartials(partialpath)
app.use(express.static(publicpath))


app.use("/",require("../router/userrouter"))
app.use("/",require("../router/adminrouter"))

app.listen(PORT,()=>{
    console.log("server running on port : "+PORT);
})