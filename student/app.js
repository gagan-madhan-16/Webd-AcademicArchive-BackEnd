const { Router } = require("express");
const app = Router();
const { Archive, Submission} = require("../db");
const cors = require('cors');
const jwt = require('jsonwebtoken');
const {authMiddleware,singleUpload} = require('../middleware');
const { getDataUri } = require("../util/dataUri");
const cloudinary = require("cloudinary");
const zod = require("zod");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

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

app.get('/archive', authMiddleware, async (req, res) => {
    const token = req.token;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const orgId=decoded.orgId;
        
        const archive = await Archive.find({organizationId:orgId});

        res.status(201).json({ 
            "archive" : archive
        });

    } catch (error) {
        res.status(500).json({ 
            msg: 'Error fetching from archive',
            error:error 
        });
    }
});


app.post('/upload', authMiddleware, singleUpload, async (req, res) => {

    const { title, tags} = req.body;
    const token = req.token;
    const file = req.file;
    const tagsArray = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : []);
    

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const studentId = decoded.userId;
        const orgId = decoded.orgId;

        const uri = getDataUri(file);
        const url = await cloudinary.v2.uploader.upload(uri.content, {
            resource_type: 'auto',
            folder: 'submissions',
            use_filename: true,
            unique_filename: true
        });
        const submission = new Submission({
            studentId:studentId,
            content:{
                public_id:url.public_id,
                url:url.secure_url
            },
            title:title,
            organizationId:orgId,
            tags:tagsArray
        })

        await submission.save();

        res.status(200).json({
            msg:"notes submitted successfullt waiting for approval"
        })
    } 
    catch (error) {
        res.status(500).json({ 
            msg: 'Error updating archive entry',
            error:error 
        });
    }
});

const commentsBody = zod.string().min(1, 'Comments can not be empty');

app.post('/addComments/:id',authMiddleware, async (req,res) => {
    const token = req.token;
    const {id} = req.params;
    const {comment} = req.body;

    const result = commentsBody.safeParse(comment);

    if (!result.success) 
    {
        return res.status(400).json({ 
        errors: result.error.errors 
        });
    } 
    else 
    {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const studentId = decoded.userId;
    
            const archive = await Archive.findById(id);

            if (!archive) {
               return res.status(404).json({
                    msg:"archive not found"
                })
            }
            else
            {
                const newComment = {
                    studentId:studentId,
                    comment:comment
                };

                archive.comments.push(newComment);

                await archive.save();

                res.status(200).json({
                    msg:"comments added successfully"
                });
            }
        } 
        catch (error) {
            res.status(500).json({ 
                msg: 'Error updating archive entry',
                error:error 
            });
        }
    }
})

module.exports = app;