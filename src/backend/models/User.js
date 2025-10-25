import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema=new mongoose.Schema({
    fullName:{
        type:String,
        required:[true,'Full name is required'],
        trim:true,
        maxlength:[50,'Do not exceed more than 50 characters'],
    },
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        minlength:[3,"Username to be atleast 3 characters"],
        maxlength:[30,"Username to be atmost 30 characters "],
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true,
        lowercase:true,
        trim:true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password:{
        type:String,
        required:true,
        minlength:[6,"Password should be min 6 characters"],
        select:false,
    },
    avatar:{
        type:String,
        default:'default-avatar.png',
    },
    bio:{
        type:String,
        maxlength:[160,'Bio to not exceed 160 characters'],
    },
    verified:{
        type:Boolean,
        default:false,

    },
    following:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    followers:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    ],
    bio:{
        type:String,
        maxlength:160
    },
    avatar:{
        type:String,
        default:'/assets/default-avatar.png'
    }
},
{
    timestamps:true,
}
);

//Hashing passwords
userSchema.pre('save',async function(next){
    if(!this.isModified('password')) return next();

    try{
        const salt=await bcrypt.genSalt(10);
        this.password=await bcrypt.hash(this.password,salt);
        next();
    }
    catch(error){
        next(error);
    }
})

//Methods to compare passwords 
userSchema.methods.comparePassword=async function (candidatePassword){
    return await bcrypt.compare(candidatePassword,this.password);
};

const User=mongoose.model('User',userSchema);
export default User;