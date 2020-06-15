const mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId

const VerifySchema = new mongoose.Schema(
    {
        userId:{
            type: ObjectId,
            required: true,
            trim: true
        },
        token:{
            type: String,
            required: true,
            trim: true
        },    
              
    },       
        
     { timestamps: true }

)

module.exports = mongoose.model('Verify', VerifySchema)