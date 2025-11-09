const mongoose = require('mongoose');

const bookSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    tweet:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Tweet',
        required:true
    }
},{
    timestamps:true
}
);

//Ensure user can't bookmark the same tweet twice
bookmarkSchema.index({user:1,tweet:1},{unique:true});

module.exports=mongoose.model('Bookmark',bookSchema)

