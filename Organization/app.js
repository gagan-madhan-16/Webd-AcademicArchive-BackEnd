const { Router } = require("express");
const app = Router();
const { User, Organization} = require("../db");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
const {isAdmin,authMiddleware, isCreator} = require("../middleware")
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

const organizationBody = zod.object({
    name: zod.string().min(1, 'Organization Name is required'),
    description: zod.string().min(50, 'Description is required'),
});

app.post("/create", async (req,res) => {
    try {
        
        const {name,password,email,organization,description} = req.body;
        const result1 = signupBody.safeParse({ name:name, password:password, email:email, isAdmin:true });
        const result2 = organizationBody.safeParse({name:organization,description:description});
        
        if (!result1.success) 
        {
            return res.status(400).json({ 
                msg:"User inputs are invalid or missing",
                errors: result1.error 
            });
        } 
        else if (!result2.success) 
        {
            return res.status(400).json({
            msg:"Organization inputs are invalid or missing", 
            errors: result2.error.errors 
            });
        } 
        else 
        {

            
            const existingOrg = await Organization.findOne({ name: organization });

            if (existingOrg) 
            {
                return res.status(400).json({
                    msg: "Organization already exists"
                });
            }


            const org = await Organization.create({
                name:organization,
                description:description
            });


            const encpswd = await bcrypt.hash(password, 10);

            
            const user = await User.create({
                name:name,
                password:encpswd,
                email:email,
                isAdmin:true,
                organizationId:org._id,
                creator:true
            });


            res.status(200).json({
                msg: "User created successfully"
            });
        }
    
    } catch (error) {
        res.status(500).json({
            msg:"internal server error try again later",
            error:error
        });
    }
});

app.put("/makeAdmin/:id", authMiddleware, isCreator , async (req,res) => {
    const token = req.token;
    const {id} = req.params;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(id);
        if(!user){
            return res.status(404).json({
                msg:"given user does not exist"
            });
        }
        else
        {
            if (user.isAdmin) {
                return res.status(400).json({
                    msg: "User is already an admin"
                });
            }

            user.isAdmin=true;
            await user.save();

            res.status(200).json({
                msg:`${user.name} is made admin`
            });
        }
    } catch (error) {
        res.status(500).json({
            msg:"internal server error try again later",
            error: error
        });
    }
});

app.put("/removeAdmin/:id", authMiddleware, isCreator , async (req,res) => {
    const {id} = req.params;

    try {

        const user = await User.findById(id);
        if(!user){
            return res.status(404).json({
                msg:"given user does not exist"
            });
        }
        else
        {
            if (!user.isAdmin) {
                return res.status(400).json({
                    msg: "User is not an admin"
                });
            }

            user.isAdmin=false;
            await user.save();

            res.status(200).json({
                msg:`${user.name} is removed form admin`
            });
        }
    } catch (error) {
        res.status(500).json({
            msg:"internal server error try again later",
            error: error
        });
    }
});

module.exports = app;