const { Router } = require("express");
const app = Router();
const jwt = require('jsonwebtoken'); 
const cors = require('cors');
const cloudinary = require("cloudinary");
const { Archive} = require("../../db");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
const {isAdmin,authMiddleware,singleUpload} = require('../../middleware');
const { getDataUri } = require("../../util/dataUri");
const zod = require("zod");

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

app.post('/', authMiddleware, isAdmin, singleUpload, async (req, res) => {
    const { title,tags } = req.body;
    const token = req.token;
    const file = req.file;
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const orgId=decoded.orgId;

        const uri = getDataUri(file);
        const url = await cloudinary.v2.uploader.upload(uri.content);

        const newEntry = new Archive({ 
            title:title, 
            content:{
                public_id:url.public_id,
                url:url.secure_url
            },
            organizationId:orgId,
            tags:tagsArray           
        });
        await newEntry.save();

        res.status(201).json({ 
            msg: 'Archive entry added successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            msg: 'Error adding to archive',
            error: error 
        });
    }
});

app.delete('/:id',authMiddleware, isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const deletedEntry = await Archive.findByIdAndDelete(id);

        if (!deletedEntry) {
            return res.status(404).json({ 
                msg: 'Archive entry not found' 
            });
        }

        res.status(200).json({ 
            msg: 'Archive entry deleted' 
        });

    } catch (error) {
        res.status(500).json({ 
            msg: 'Error deleting archive entry',
            error:error 
        });
    }
});

const commentsBody = zod.string().min(1, 'Comments can not be empty');

app.post('/addComments/:id',authMiddleware, isAdmin, async (req,res) => {
    const token = req.token;
    const {id} = req.params;
    const {comment} = req.body;

    const result = commentsBody.safeParse(comment);

    if (!result) 
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
                msg: 'Error updating comments',
                error:error 
            });
        }
    }
})

module.exports = app;

