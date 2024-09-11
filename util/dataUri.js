const DataUriParser = require("datauri/parser");
const path = require("path");

const getDataUri = (file) => {
    try {
        const parser = new DataUriParser();
        const extName = path.extname(file.originalname).toString();

        if (!extName) {
           return  console.log("File extension could not be determined");
        }

        return parser.format(extName, file.buffer);
    } catch (error) {
        console.log("Error generating Data URI:", error);
    }
}


module.exports ={
    getDataUri
};