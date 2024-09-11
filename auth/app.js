const { Router } = require("express");
const app = Router();
const { User, Organization} = require("../db");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");
const zod = require("zod");
const bcrypt = require('bcryptjs');
const cors = require('cors');

app.use(cors({
    origin: 'http://localhost:5173',     
    credentials: true,
}));

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        msg: 'Internal Server Error' 
    });
};

app.use(errorHandler);

const signupBody = zod.object({
    name: zod.string().min(1, 'Name is required'),
    password: zod.string().min(1, 'Password is required'),
    email: zod.string().email('Invalid email address').min(1, 'Email is required'),
    isAdmin: zod.boolean().default(false),
});

app.post("/signup", async (req,res) => {
    try {
        const {name,password,email,organization} = req.body;
        const isAdmin = false;
        const result = signupBody.safeParse({ name:name, password:password, email:email, isAdmin:isAdmin });
    
        if (!result.success) 
        {
            return res.status(400).json({ 
                errors: result.error.errors 
            });
        } 
        else 
        {
            const org = await Organization.findOne({ name : organization });
        
            const existingUser = await User.findOne({ email : email , organizationId : org._id});
        
            if (existingUser) 
            {
                return res.status(411).json({
                    msg: "Email already taken / Incorrect inputs",
                });
            }
            else
            {
                const encpswd = await bcrypt.hash(password, 10);
                const user = await User.create({
                    name:name,
                    password:encpswd,
                    email:email,
                    isAdmin:isAdmin,
                    organizationId:org._id
                });
                const userId = user._id;
                const orgId = org._id;
        
                
        
                res.status(200).json({
                    msg: "User created successfully"
                });


            }
        }
    
    } catch (error) {
        res.status(500).json({
            msg:"internal server error try again later",
            error:error
        });
    }
});

const signinBody = zod.object({
    password: zod.string().min(1, 'Password is required'),
    email: zod.string().email('Invalid email address').min(1, 'Email is required')
});

app.post('/signin', async (req,res) => {
    try {
        const {email,password,organization} = req.body;    
        const result = signinBody.safeParse({ password:password, email:email });
    
        if (!result.success) 
        {
            return res.status(400).json({ 
                errors: result.error.errors 
            });
        } 
        else 
        {
            const org = await Organization.findOne({ name : organization });
            const user = await User.findOne({ email : email , organizationId : org._id});
    
            if (user && await bcrypt.compare(password, user.password)) 
            {
                const userId = user._id, name = user.name, orgId = org._id;
                const token = jwt.sign({ userId, name, orgId, organization }, JWT_SECRET);
                
                return res.status(200).json({
                    msg: "Sign-in successful",
                    token: token,
                });
            }
    
            res.status(401).json({
                msg: "Invalid email or password",
            });
        }
    } catch (error) {
        res.status(500).json({
            msg:"internal server error try again later",
            error:error
        });
    }
});

module.exports = app;