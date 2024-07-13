const mongoose = require("mongoose")

const emailSchema = new mongoose.Schema({

    name: { type: String, required: true },
    amount: { type: Number, required: true },
    comment: { type: String, required: true },
    
})

module.exports = mongoose.model("emails", emailSchema)