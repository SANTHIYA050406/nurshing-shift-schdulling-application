const express = require('express');
const router = express.Router();
const OvertimeAllocation = require('../models/OvertimeAllocation');
const Nurse = require('../models/Nurse');

// Helper to seed sample allocations if empty
async function seedInitialAllocations() {
    const count = await OvertimeAllocation.countDocuments();
    if (count === 0) {
        const nurses = await Nurse.find().limit(5);
        if (nurses.length > 0) {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const initialData = [
                {
                    nurseId: nurses[0]._id,
                    date: today,
                    allocatedHours: 4,
                    shiftPeriod: 'Evening Extension',
                    reason: 'Critical ICU Surge: Patient bed ratio coverage',
                    status: 'Pending Nurse Approval',
                    allocatedBy: 'Chief Nursing Officer'
                },
                {
                    nurseId: nurses[0]._id,
                    date: new Date(Date.now() - 86400000 * 3),
                    allocatedHours: 3,
                    shiftPeriod: 'Night Extension',
                    reason: 'Emergency Post-op monitoring support',
                    status: 'Accepted',
                    completedHours: 3,
                    approvedAt: new Date(Date.now() - 86400000 * 3),
                    allocatedBy: 'Ward Administrator'
                },
                {
                    nurseId: nurses[0]._id,
                    date: new Date(Date.now() - 86400000 * 7),
                    allocatedHours: 5,
                    shiftPeriod: 'Weekend Emergency',
                    reason: 'Trauma Bay Code Blue assistance',
                    status: 'Accepted',
                    completedHours: 5,
                    approvedAt: new Date(Date.now() - 86400000 * 7),
                    allocatedBy: 'Hospital Admin'
                }
            ];

            if (nurses[1]) {
                initialData.push({
                    nurseId: nurses[1]._id,
                    date: tomorrow,
                    allocatedHours: 3,
                    shiftPeriod: 'Evening Extension',
                    reason: 'Cardiology Ward shift replacement for staff training',
                    status: 'Pending Nurse Approval',
                    allocatedBy: 'Hospital Admin'
                });
            }

            await OvertimeAllocation.insertMany(initialData);
            console.log('Seeded sample overtime allocations.');
        }
    }
}

// Get all overtime allocations (optionally filter by nurseId)
router.get('/', async (req, res) => {
    try {
        await seedInitialAllocations();
        const filter = {};
        if (req.query.nurseId) {
            filter.nurseId = req.query.nurseId;
        }
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const allocations = await OvertimeAllocation.find(filter)
            .populate('nurseId', 'name employeeId department designation')
            .sort({ date: -1 });

        res.json(allocations);
    } catch (err) {
        console.error('Error fetching overtime allocations:', err);
        res.status(500).json({ message: err.message });
    }
});

// Nurse responds: Accept or Decline overtime allocated by Admin
router.patch('/:id/respond', async (req, res) => {
    try {
        const { status, nurseRemarks } = req.body;
        if (!['Accepted', 'Declined'].includes(status)) {
            return res.status(400).json({ message: 'Status must be Accepted or Declined' });
        }

        const allocation = await OvertimeAllocation.findById(req.params.id);
        if (!allocation) {
            return res.status(404).json({ message: 'Overtime allocation not found' });
        }

        allocation.status = status;
        if (nurseRemarks !== undefined) allocation.nurseRemarks = nurseRemarks;
        if (status === 'Accepted') {
            allocation.approvedAt = new Date();
            allocation.completedHours = allocation.allocatedHours; // Mark hours active
        }
        await allocation.save();

        const updated = await OvertimeAllocation.findById(allocation._id)
            .populate('nurseId', 'name employeeId department designation');

        res.json({
            message: `Overtime allocation has been ${status.toLowerCase()} by nurse.`,
            allocation: updated
        });
    } catch (err) {
        console.error('Error updating overtime allocation:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET /api/overtime/recommended-candidates
// Returns nurses sorted by lowest overtime, excluding those currently working the conflicting shift
router.get('/recommended-candidates', async (req, res) => {
    try {
        const { date, shiftPeriod } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const allNurses = await Nurse.find();

        // 1. Fetch nurses on leave
        const LeaveRequest = require('../models/LeaveRequest');
        const onLeave = await LeaveRequest.find({
            status: { $in: ['Approved', 'Pending'] },
            startDate: { $lte: endOfDay },
            endDate: { $gte: startOfDay }
        });
        const onLeaveNurseIds = new Set(onLeave.map(l => l.nurseId.toString()));

        // 2. Fetch schedules for targetDate to know who is working which shift
        const Schedule = require('../models/Schedule');
        const schedules = await Schedule.find({
            'shifts.date': { $gte: startOfDay, $lte: endOfDay }
        });

        // Determine conflicting shift type from shiftPeriod
        // e.g. "Morning Extension" conflicts with working Morning shift
        let conflictingShift = 'Morning';
        if (shiftPeriod?.includes('Evening')) conflictingShift = 'Evening';
        if (shiftPeriod?.includes('Night')) conflictingShift = 'Night';

        const workingConflictNurseIds = new Set();
        schedules.forEach(sched => {
            sched.shifts.forEach(s => {
                const sDate = new Date(s.date);
                if (sDate >= startOfDay && sDate <= endOfDay && s.shiftType === conflictingShift) {
                    workingConflictNurseIds.add(s.nurseId.toString());
                }
            });
        });

        // 3. Compute accumulated overtime per nurse
        const allAllocations = await OvertimeAllocation.find();
        const otMap = new Map();
        allAllocations.forEach(a => {
            const id = a.nurseId.toString();
            const hrs = a.completedHours || a.allocatedHours || 0;
            otMap.set(id, (otMap.get(id) || 0) + hrs);
        });

        // 4. Build candidate list
        const candidates = allNurses.map(nurse => {
            const id = nurse._id.toString();
            const isOnLeave = onLeaveNurseIds.has(id);
            const isWorkingShift = workingConflictNurseIds.has(id);
            const totalOT = otMap.get(id) || 0;

            let eligible = true;
            let restrictionReason = null;

            if (isOnLeave) {
                eligible = false;
                restrictionReason = 'Nurse is on approved / pending leave';
            } else if (isWorkingShift) {
                eligible = false;
                restrictionReason = `Already assigned to ${conflictingShift} shift (Cannot continue same shift)`;
            }

            return {
                _id: nurse._id,
                name: nurse.name,
                employeeId: nurse.employeeId,
                department: nurse.department,
                designation: nurse.designation,
                totalOvertimeHours: totalOT,
                isEligible: eligible,
                restrictionReason
            };
        });

        // Sort: Eligible first, then by lowest overtime ascending
        candidates.sort((a, b) => {
            if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
            return a.totalOvertimeHours - b.totalOvertimeHours;
        });

        res.json(candidates);
    } catch (err) {
        console.error('Error fetching recommended overtime candidates:', err);
        res.status(500).json({ message: err.message });
    }
});

// Admin creates overtime allocation for a nurse with shift validation
router.post('/allocate', async (req, res) => {
    try {
        const { nurseId, date, allocatedHours, reason, shiftPeriod, allocatedBy } = req.body;
        if (!nurseId || !date || !allocatedHours || !reason) {
            return res.status(400).json({ message: 'nurseId, date, allocatedHours, and reason are required' });
        }

        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Check if nurse is on leave on this date
        const LeaveRequest = require('../models/LeaveRequest');
        const nurseOnLeave = await LeaveRequest.findOne({
            nurseId,
            status: { $in: ['Approved', 'Pending'] },
            startDate: { $lte: endOfDay },
            endDate: { $gte: startOfDay }
        });
        if (nurseOnLeave) {
            return res.status(400).json({ message: `Cannot allocate overtime: Nurse is currently on leave on ${targetDate.toDateString()}` });
        }

        // Check if nurse is working the conflicting shift (cannot continue with the same shift)
        const Schedule = require('../models/Schedule');
        let conflictingShift = 'Morning';
        if (shiftPeriod?.includes('Evening')) conflictingShift = 'Evening';
        if (shiftPeriod?.includes('Night')) conflictingShift = 'Night';

        const conflictingSchedule = await Schedule.findOne({
            'shifts': {
                $elemMatch: {
                    nurseId,
                    date: { $gte: startOfDay, $lte: endOfDay },
                    shiftType: conflictingShift
                }
            }
        });

        if (conflictingSchedule) {
            return res.status(400).json({ 
                message: `Constraint Conflict: Nurse is already working the ${conflictingShift} shift on this date. Overtime must not continue with their active regular shift.` 
            });
        }

        const newAllocation = new OvertimeAllocation({
            nurseId,
            date: targetDate,
            allocatedHours: Number(allocatedHours),
            reason,
            shiftPeriod: shiftPeriod || 'Evening Extension',
            allocatedBy: allocatedBy || 'Hospital Admin',
            status: 'Pending Nurse Approval'
        });

        await newAllocation.save();
        const populated = await OvertimeAllocation.findById(newAllocation._id)
            .populate('nurseId', 'name employeeId department designation');

        res.status(201).json(populated);
    } catch (err) {
        console.error('Error allocating overtime:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
