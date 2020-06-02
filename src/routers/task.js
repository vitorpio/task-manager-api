const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send({ message: error.message })
    }
})

router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const options = {}

    // Evaluate options
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }
    if (req.query.limit) {
        options.limit = parseInt(req.query.limit)
    }
    if (req.query.skip) {
        options.skip = parseInt(req.query.skip)
    }
    if (req.query.sortBy) {
        options.sort = {}
        const [field, order] = req.query.sortBy.split('_')
        options.sort[field] = order === 'desc' ? -1 : 1
    }
    try {
        await req.user
            .populate({ path: 'tasks', match, options })
            .execPopulate()
        res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send({ message: 'Task no found' })
        }
        res.send(task)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
    )
    if (!isValidOperation) {
        return res.status(400).send({ message: 'Invalid updates' })
    }
    const _id = req.params.id
    try {
        const task = await Task.findOne({
            _id,
            owner: req.user._id
        })

        if (!task) {
            return res.status(404).send({ message: 'Task not found' })
        }

        updates.forEach((update) => (task[update] = req.body[update]))
        await task.save()
        res.send(task)
    } catch (eror) {
        res.status(400).send({ message: error.message })
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send({ message: 'Task not found' })
        }
        res.send(task)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

module.exports = router
