const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});

const QUEUE_NAME = process.env.QUEUE_NAME || 'taskflow_queue';

const jobQueue = new Queue(QUEUE_NAME, { connection });

const addJobToQueue = async (jobId, type, payload) => {
    return await jobQueue.add(
        type,
        { jobId: jobId.toString(), type, payload },
        {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 },
        }
    );
};

module.exports = { jobQueue, addJobToQueue, connection };
