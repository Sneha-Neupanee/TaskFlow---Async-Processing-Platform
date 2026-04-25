const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/create', jobController.createJob);
router.get('/user', jobController.getUserJobs);
router.get('/:id', jobController.getJobById);

module.exports = router;
