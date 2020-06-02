const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendGoodbyeEmail } = require('../emails/account')

const router = express.Router()

router.post('/users', async (req, res) => {
    const user = User(req.body)
    try {
        await user.save()
        sendWelcomeEmail(user)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (error) {
        res.status(400).send({ message: error.message })
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(
            req.body.email,
            req.body.password
        )
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (error) {
        res.status(400).send({ message: error.message })
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send({ message: 'Successfully logout' })
    } catch (error) {
        req.status(500).send({ message: 'Error login out' })
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send({ message: 'Successfully logout from all sessions' })
    } catch (error) {
        res.status(500).send({ message: 'Error login out from all sessions' })
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
    )
    if (!isValidOperation) {
        return res.status(400).send({ message: 'Invalid updates' })
    }
    try {
        updates.forEach((update) => (req.user[update] = req.body[update]))
        await req.user.save()
        res.send(req.user)
    } catch (error) {
        res.status(400).send({ message: error.message })
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendGoodbyeEmail(req.user)
        res.send(req.user)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

const avatarUploads = multer({
    limits: { fileSize: 1000000 },
    fileFilter(req, file, cb) {
        if (!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
            return cb(
                new Error('Only image files(jpg, jpeg, png) are supported')
            )
        }
        cb(undefined, true)
    }
})

router.post(
    '/users/me/avatar',
    auth,
    avatarUploads.single('avatar'),
    async (req, res) => {
        try {
            const buffer = await sharp(req.file.buffer)
                .resize({ width: 250, height: 250 })
                .png()
                .toBuffer()
            req.user.avatar = buffer
            await req.user.save()
            res.send({ message: 'User image uploaded' })
        } catch (error) {
            res.status(500).send({ message: error.message })
        }
    },
    (error, req, res, next) => {
        res.status(400).send({ message: error.message })
    }
)

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    try {
        await req.user.save()
        res.send({ message: 'User image removed' })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error('User not found or Avatar image not found')
        }
        res.set('Content-Type', 'image/png').send(user.avatar)
    } catch (error) {
        res.status(404).send({ message: error.message })
    }
})

module.exports = router
