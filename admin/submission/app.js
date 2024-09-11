const { Router } = require("express");
const app = Router();
const cors = require('cors');
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
const {Submission, Archive} = require("../../db");
const { authMiddleware, isAdmin} = require('../../middleware');

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


app.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const token = req.token;
        const decoded = jwt.verify(token, JWT_SECRET);
        const orgId = decoded.orgId;
        const submissions = await Submission.find({ organizationId:orgId }).populate('studentId');
        res.status(200).json({
            msg:"archive",
            submissions:submissions
        });

    } catch (error) {

        res.status(500).json({ 
            msg: 'Error retrieving submissions',
            error:error 
        });

    }
});

app.put('/:id', authMiddleware, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, tagsAdd, tagsRemove} = req.body;  

    const Add = Array.isArray(tagsAdd) ? tagsAdd : (typeof tagsAdd === 'string' ? tagsAdd.split(',').map(tag => tag.trim()) : []);
    const Remove = Array.isArray(tagsRemove) ? tagsRemove : (typeof tagsRemove === 'string' ? tagsRemove.split(',').map(tag => tag.trim()) : []);

    
    try {
        const submission = await Submission.findById(id);

        if(submission && status=='approved')
        {
            let tags = submission.tags.filter(tag => !Remove.includes(tag));
            tags = [...new Set([...tags, ...Add])];

            const archive = new Archive({
                title : submission.title,
                content : submission.content,
                organizationId : submission.organizationId,
                tags:tags
            });
            
            await archive.save();
            await Submission.findByIdAndDelete(submission._id);
        }
        else if(submission && status=='rejected')
        {
            await Submission.findByIdAndDelete(submission._id);
        }

        if (!submission) {
            return res.status(404).json({ 
                msg: 'Submission not found'
            });
        }

        res.status(200).json({ 
            msg: `Submission ${status}` 
        });
        
    } catch (error) {
        res.status(500).json({ 
            msg: 'Error updating submission status',
            error:error 
        });
    }
});

module.exports = app;