const { Queue } = require('bullmq');

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
};

const jobQueue = new Queue('jobQueue', { connection });

const addJobToQueue = async (jobId, type, payload) => {
    return await jobQueue.add(
        type,
        { jobId, type, payload },
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
    );
};

module.exports = { jobQueue, addJobToQueue };
