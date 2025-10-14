const express = require('express');
const router = express.Router();
const {
  getFamilyTree,
  addFamilyMember,
  updateFamilyMember,
  removeFamilyMember,
  searchFamilyMembers,
  getFamilyDirectory,
  assignFamilyHead,
  getFamilyMember,
  getUserRelationships
} = require('../controllers/familyTree.controller');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin, requireAdminOrMember } = require('../middleware/role');

// All family tree routes require authentication
router.use(verifyToken);

// Family Tree Structure Routes (All authenticated users can view)
router.get('/tree', getFamilyTree); // GET /api/family-tree/tree?user_id=uuid
router.get('/directory', getFamilyDirectory); // GET /api/family-tree/directory

// Family Member Management Routes (Admin-controlled for add/edit/delete)
router.post('/members', requireAdmin, addFamilyMember); // POST /api/family-tree/members (Admin only)
router.get('/members/search', searchFamilyMembers); // GET /api/family-tree/members/search (All users)
router.get('/members/:id', getFamilyMember); // GET /api/family-tree/members/:id (All users)
router.put('/members/:id', requireAdmin, updateFamilyMember); // PUT /api/family-tree/members/:id (Admin only)
router.delete('/members/:id', requireAdmin, removeFamilyMember); // DELETE /api/family-tree/members/:id (Admin only)

// User-specific Routes (All authenticated users can view their own relationships)
router.get('/users/:user_id/relationships', getUserRelationships); // GET /api/family-tree/users/:user_id/relationships

// Family Head Management Routes (Admin-controlled)
router.post('/assign-head', requireAdmin, assignFamilyHead); // POST /api/family-tree/assign-head (Admin only)

module.exports = router;
