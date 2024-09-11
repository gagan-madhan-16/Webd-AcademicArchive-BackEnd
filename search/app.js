const { Router } = require("express");
const app = Router();
const { Archive} = require("../db");
const { authMiddleware} = require("../middleware");
const cors = require('cors');
const jwt = require('jsonwebtoken');
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

app.get('/date' , authMiddleware,  async (req, res) => {
    const token = req.token;
    const { startDate, endDate } = req.query;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const orgId=decoded.orgId;

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                msg: 'Invalid date format. Use YYYY-MM-DD.'
            });
        }

        if (start > end) {
            return res.status(400).json({
                msg: 'Start date must be before end date.'
            });
        }
    
        end.setHours(23, 59, 59, 999);
        
        const archive = await Archive.find({organizationId: orgId , createdAt : {
            $gte: start,
            $lt: end
        } });

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

app.get('/title/:title', authMiddleware, async (req, res) => {
    const token = req.token;
    const {title} = req.params;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const orgId=decoded.orgId;

        const archive = await Archive.find({organizationId:orgId , title: { $regex: title, $options: 'i' }  });

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


app.get('/filter' , authMiddleware, async (req,res) => {
    const token = req.token;
    const {tags} = req.query;

    try {

        const tagArray = tags ? tags.split(',').map(t => t.trim()) : [];

        const decoded = jwt.verify(token, JWT_SECRET);
        const orgId=decoded.orgId;

        const archive = await Archive.find({organizationId:orgId ,tags: { $all: tagArray } });

        res.status(201).json({ 
            "archive" : archive
        });

    } catch (error) {
        res.status(500).json({ 
            msg: 'Error fetching from archive',
            error: error 
        });
    }
})

module.exports = app;

