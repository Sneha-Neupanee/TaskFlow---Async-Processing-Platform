const Job = require('../models/Job');
const { addJobToQueue } = require('../services/queueService');

exports.createJob = async (req, res) => {
    try {
        const { type, payload } = req.body;

        if (!['image', 'csv', 'simulation'].includes(type)) {
            return res.status(400).json({ message: 'Invalid job type' });
        }

        const job = new Job({
            userId: req.user.id,
            type,
            payload
        });

        await job.save();

        // Push to Queue
        await addJobToQueue(job._id, type, payload);

        res.status(201).json(job);
    } catch (err) {
        console.error("Job Creation Error", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getUserJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        res.json(job);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
