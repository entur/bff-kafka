import { Router } from 'express'

const router = Router()

router.get('/hello-world', async (req, res, next) => {
    console.log('hi there')
    try {
        res.json({ hello: 'world' })
    } catch (error) {
        next(error)
    }
})

export default router
