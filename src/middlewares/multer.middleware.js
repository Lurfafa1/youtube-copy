import multer from 'multer';


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/temp')
    },

    // file name create unique name for each file using timestamp and original name
    // so that it does not override the file with same name
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})


export const upload = multer({
    storage: storage,
})