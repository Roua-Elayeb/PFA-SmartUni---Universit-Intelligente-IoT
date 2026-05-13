const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { register, login, getProfile, getAllUsers, deleteUser, updateUser } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);

// Routes admin
router.get('/users', protect, adminOnly, getAllUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.put('/users/:id', protect, adminOnly, updateUser);
module.exports = router;