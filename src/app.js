import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'


const app = express()


app.use(cors({
    origin: 'localhost:4000' || '0.0.0.0',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))


app.use(express.json({ limit: '16kb' }))
app.use(express.urlencoded({ extended: true, limit: '16kb' }))
app.use(express.static('public'))
app.use(cookieParser());


import { router } from './routes/user.routes.js'
import { videoRouter } from './routes/video.routes.js'
import { likesRouter } from './routes/like.routes.js'
import { postRouter } from './routes/post.routes.js'
import { commentRouter } from './routes/comment.routes.js'
import { subscribeRouter } from "./routes/subscribe.route.js";


app.use('/api/v1/users', router)
app.use('/api/v1/videos', videoRouter);
app.use('/api/v1/likes', likesRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/subscriptions', subscribeRouter);

export { app };


