const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    console.log('mongodb connected connected');
})
.catch((e)=>{
    console.log('failed');
})

const user = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        trim: true,
        unique: true,
        lowercase: true,
    },
    isAdmin:{
        type:Boolean,
        required:true,
        default:false
    },
    creator:{
        type:Boolean,
        required:true,
        default:false
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization'
    }

});

const organization = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
});

const submission = new mongoose.Schema({
    studentId:{ 
        type: mongoose.Schema.Types.ObjectId, 
        required: true ,
        ref: 'User'
    },
    content: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    title:{
        type:String,
        require:true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    tags: [{
        type: String
    }]
});

const archive = new mongoose.Schema({
    title:{ 
        type: String, 
        required: true 
    },
    content: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    createdAt:{ 
        type: Date, 
        default: Date.now 
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    comments: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId, 
            required: true ,
            ref: 'User'
        },
        comment: {
            type: String,
            required: true,
        },
        postedAt: {
            type: Date,
            default: Date.now,
        }
    }],
    tags: [{
        type: String
    }]
});

const User = mongoose.model('User', user);
const Organization =mongoose.model('Organization', organization);
const Archive = mongoose.model('Archive', archive);
const Submission = mongoose.model('Submission', submission);

module.exports = {
    User,
    Organization,
    Submission,
    Archive
  };