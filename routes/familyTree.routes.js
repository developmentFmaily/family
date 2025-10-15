const express = require('express');
const router = express.Router();
const {
  getFamilyTreeData,
  addFamilyMember,
  updateFamilyMember,
  removeFamilyMember,
  assignFamilyHead,
  getFamilyMember
} = require('../controllers/familyTree.controller');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin, requireAdminOrMember } = require('../middleware/role');

// All family tree routes require authentication
router.use(verifyToken);

// Main family tree GET endpoint (handles tree, directory, search, relationships)
router.get('/', getFamilyTreeData); // GET /api/family-tree?type=tree&user_id=uuid

// Specific relationship by ID
router.get('/:id', getFamilyMember); // GET /api/family-tree/:id

// Admin operations
router.post('/', requireAdmin, addFamilyMember); // POST /api/family-tree (Admin only)
router.put('/:id', requireAdmin, updateFamilyMember); // PUT /api/family-tree/:id (Admin only)
router.delete('/:id', requireAdmin, removeFamilyMember); // DELETE /api/family-tree/:id (Admin only)

// Family Head Management (Admin-controlled)
router.post('/assign-head', requireAdmin, assignFamilyHead); // POST /api/family-tree/assign-head (Admin only)

module.exports = router;
