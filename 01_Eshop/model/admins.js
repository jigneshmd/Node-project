const mongoose = require("mongoose")

const adminSchema = new mongoose.Schema({

uname:{
    type:String
},
email:{
    type:String
},
pass:{
    type:String
}
})

module.exports = new mongoose.model("Admin",adminSchema)