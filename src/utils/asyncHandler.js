const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise
            .resolve(requestHandler(req, res, next))
            .catch((err) => {
                res.status(err.code || 500).json({
                    success: false,
                    message: err.message || 'Internal Server Error Coming from AsyncHandler',
                })
                next(err)
            })
    }
}




export { asyncHandler }



// const asyncHandler = (func) => async (req, res, next) => {
//     try {
//         await func(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message || 'Internal Server Error Coming from AsyncHandler',
//         })
//         next(error)
//     }
// }