import Group from '../models/Group.js';

// Add a user to the group (only admin can perform this operation)
const addUserToGroup = async (groupId, userId, adminId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new Error('Group not found');
    }
    if (group.adminId.toString() !== adminId.toString()) {
        throw new Error('Only admin can add users to the group');
    }
    if (group.members.includes(userId)) {
        throw new Error('User is already a member of the group');
    }
    group.members.push(userId);
    await group.save();
    return group;
};

// View group members
const viewGroupMembers = async (groupId) => {
    console.log("groupId-------------------------------",groupId)
    const group = await Group.findById(groupId).populate('members', 'name email pic');
    if (!group) {
        throw new Error('Group not found');
    }
    return group.members;
};

// Remove a user from the group (only admin can perform this operation)
const removeUserFromGroup = async (groupId, userId, adminId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new Error('Group not found');
    }
    if (group.adminId.toString() !== adminId.toString()) {
        throw new Error('Only admin can remove users from the group');
    }
    if (!group.members.includes(userId)) {
        throw new Error('User is not a member of the group');
    }
    group.members = group.members.filter(memberId => memberId.toString() !== userId.toString());
    await group.save();
    return group;
};

// Create a group
const createGroup = async (groupName, adminId) => {
    const group = new Group({
        name: groupName,
        adminId: adminId,
        members: [adminId] // Add the admin as the first member
    });
    await group.save();
    return group;
};
const viewGroupsList = async (req, res) => {
    try {
        const groups = await Group.find();
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// Delete a group
const deleteGroup = async (groupId, adminId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new Error('Group not found');
    }
    if (group.adminId.toString() !== adminId.toString()) {
        throw new Error('Only admin can delete the group');
    }
    await Group.findByIdAndDelete(groupId);
    return group;
};

// Leave a group
const leaveGroup = async (groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) {
        throw new Error('Group not found');
    }
    if (!group.members.includes(userId)) {
        throw new Error('User is not a member of the group');
    }
    group.members = group.members.filter(memberId => memberId.toString() !== userId.toString());
    await group.save();
    return group;
};

export { addUserToGroup, viewGroupMembers, removeUserFromGroup, createGroup, deleteGroup, leaveGroup,viewGroupsList };
