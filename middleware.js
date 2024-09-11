require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
const {User} = require("./db")
const jwt = require("jsonwebtoken");
const multer = require("multer");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({
            msg:"access not allowed"
        });
    }
    
    const token = authHeader.split(" ")[1];
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.token = token;
        
        next();
    } catch (err) {
        return res.status(403).json({
            msg:"please signin before accessing"
        });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const token = req.token;
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        if (user.isAdmin) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Admins only.' });
        }
    } catch (err) {
        res.status(500).json({ msg: 'Server error while checking admin status.', error: err });
    }
};

const isCreator = async (req, res, next) => {
    try {
        const token = req.token;
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        if (user.creator) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Creator only.' });
        }
    } catch (err) {
        res.status(500).json({ msg: 'Server error while checking admin status.', error: err });
    }
};

const storage = multer.memoryStorage();

const singleUpload = multer({storage}).single("file");

module.exports = {
    isAdmin,
    authMiddleware,
    isCreator,
    singleUpload
};
  