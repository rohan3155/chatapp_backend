import express from 'express';
import { addUserToGroup, viewGroupMembers, removeUserFromGroup, createGroup, deleteGroup, leaveGroup, viewGroupsList } from '../controllers/Group.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/list', protect, viewGroupsList);

// Add a user to the group (only admin can perform this operation)
router.post('/:groupId/addUser', protect, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId } = req.body;
        const { _id: adminId } = req.user; // Get admin ID from the logged-in user
        const group = await addUserToGroup(groupId, userId, adminId);
        res.json(group);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// View group members
router.get('/:groupId/members', protect, async (req, res) => {
    try {
        const { groupId } = req.params;
        const members = await viewGroupMembers(groupId);
        res.json(members);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Remove a user from the group (only admin can perform this operation)
router.delete('/:groupId/removeUser/:userId', protect, async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const { _id: adminId } = req.user; // Get admin ID from the logged-in user
        const group = await removeUserFromGroup(groupId, userId, adminId);
        res.json(group);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Create a group
router.post('/createGroup', protect, async (req, res) => {
    try {
        const { groupName } = req.body;
        const { _id: adminId } = req.user; // Get admin ID from the logged-in user
        const group = await createGroup(groupName, adminId);
        res.json(group);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a group
router.delete('/:groupId/deleteGroup', protect, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { _id: adminId } = req.user; // Get admin ID from the logged-in user
        const group = await deleteGroup(groupId, adminId);
        res.json(group);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Leave a group
router.delete('/:groupId/leaveGroup', protect, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { _id: userId } = req.user; // Get user ID from the logged-in user
        const group = await leaveGroup(groupId, userId);
        res.json(group);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
