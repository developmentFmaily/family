const express = require('express');
const router = express.Router();

const userRoutes = require('./user.routes');
const familyTreeRoutes = require('./familyTree.routes');

router.use('/users', userRoutes);
router.use('/family-tree', familyTreeRoutes);

module.exports = router;
