const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const Availability = require('../models/Availability');
const Schedule = require('../models/Schedule');

// GET all leave requests (can filter by nurseId or status)
router.get('/', async (req, res) => {
    try {
        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.nurseId) query.nurseId = req.query.nurseId;

        const leaves = await LeaveRequest.find(query)
            .populate('nurseId', 'name employeeId department designation')
            .sort({ appliedAt: -1 });
            
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST: Nurse applies for leave
router.post('/', async (req, res) => {
    try {
        const { nurseId, startDate, endDate, reason } = req.body;
        if (!nurseId || !startDate || !endDate) {
            return res.status(400).json({ message: 'nurseId, startDate, and endDate are required' });
        }

        const leave = new LeaveRequest({
            nurseId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason: reason || 'Personal Leave',
            status: 'Pending'
        });

        const savedLeave = await leave.save();
        const populated = await LeaveRequest.findById(savedLeave._id).populate('nurseId', 'name employeeId department designation');
        res.status(201).json(populated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH: Admin Approves or Rejects leave request
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be Approved or Rejected' });
        }

        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave request not found' });

        leave.status = status;
        leave.reviewedAt = new Date();
        if (adminNotes) leave.adminNotes = adminNotes;
        await leave.save();

        // If Approved, update Availability records to 'Leave' for each day in range
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);

        if (status === 'Approved') {
            const leaveStart = new Date(start);
            leaveStart.setHours(0, 0, 0, 0);
            const leaveEnd = new Date(end);
            leaveEnd.setHours(23, 59, 59, 999);

            const Nurse = require('../models/Nurse');
            const OvertimeAllocation = require('../models/OvertimeAllocation');
            const onLeaveNurse = await Nurse.findById(leave.nurseId);

            // If leave is approved, remove the nurse's name from the auto schedule for these dates
            const overlappingSchedules = await Schedule.find({
                'shifts.nurseId': leave.nurseId,
                'shifts.date': { $gte: leaveStart, $lte: leaveEnd }
            });

            for (const sched of overlappingSchedules) {
                // Find shifts that need replacement
                const removedShifts = sched.shifts.filter(s => {
                    const sDate = new Date(s.date);
                    const isSameNurse = s.nurseId.toString() === leave.nurseId.toString();
                    const isInLeave = sDate >= leaveStart && sDate <= leaveEnd;
                    return isSameNurse && isInLeave;
                });

                // Remove the nurse on approved leave from the auto schedule
                sched.shifts = sched.shifts.filter(s => {
                    const sDate = new Date(s.date);
                    const isSameNurse = s.nurseId.toString() === leave.nurseId.toString();
                    const isInLeave = sDate >= leaveStart && sDate <= leaveEnd;
                    return !(isSameNurse && isInLeave);
                });

                // For each removed shift, allocate an overtime replacement from off-duty nurses with lowest overtime
                for (const removedShift of removedShifts) {
                    const shiftDate = new Date(removedShift.date);
                    const deptNurses = await Nurse.find({ department: sched.department });

                    const otAllocations = await OvertimeAllocation.find();
                    const otMap = new Map();
                    otAllocations.forEach(a => {
                        const id = a.nurseId.toString();
                        otMap.set(id, (otMap.get(id) || 0) + (a.completedHours || a.allocatedHours || 0));
                    });

                    // Check who is already working this shift
                    const busyNurseIds = new Set(
                        sched.shifts
                            .filter(s => new Date(s.date).toDateString() === shiftDate.toDateString() && s.shiftType === removedShift.shiftType)
                            .map(s => s.nurseId.toString())
                    );
                    busyNurseIds.add(leave.nurseId.toString());

                    // Find candidates in department, sorted by lowest overtime
                    const candidates = deptNurses.filter(n => !busyNurseIds.has(n._id.toString()));
                    candidates.sort((a, b) => (otMap.get(a._id.toString()) || 0) - (otMap.get(b._id.toString()) || 0));

                    if (candidates.length > 0) {
                        const subNurse = candidates[0];
                        sched.shifts.push({
                            date: shiftDate,
                            shiftType: removedShift.shiftType,
                            nurseId: subNurse._id,
                            isOvertime: true,
                            overtimeReason: `Overtime replacement for approved leave of ${onLeaveNurse?.name || 'colleague'}`
                        });

                        try {
                            const ot = new OvertimeAllocation({
                                nurseId: subNurse._id,
                                date: shiftDate,
                                allocatedHours: 8,
                                shiftPeriod: removedShift.shiftType === 'Morning' ? 'Morning Extension' : removedShift.shiftType === 'Evening' ? 'Evening Extension' : 'Night Extension',
                                reason: `Overtime replacement for approved leave of ${onLeaveNurse?.name || 'colleague'} in ${sched.department}`,
                                allocatedBy: 'Auto Leave Substitution System',
                                status: 'Accepted',
                                completedHours: 8,
                                approvedAt: new Date()
                            });
                            await ot.save();
                        } catch (err) {
                            console.error('Error creating replacement OT allocation:', err.message);
                        }
                    }
                }

                await sched.save();
            }
        }

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateOnly = new Date(d);
            dateOnly.setHours(0, 0, 0, 0);

            if (status === 'Approved') {
                // Upsert to Leave
                await Availability.findOneAndUpdate(
                    { nurseId: leave.nurseId, date: dateOnly },
                    { nurseId: leave.nurseId, date: dateOnly, status: 'Leave' },
                    { upsert: true, new: true }
                );
            } else if (status === 'Rejected') {
                // Revert to Available if exists
                await Availability.findOneAndUpdate(
                    { nurseId: leave.nurseId, date: dateOnly },
                    { nurseId: leave.nurseId, date: dateOnly, status: 'Available' },
                    { upsert: true, new: true }
                );
            }
        }

        const populated = await LeaveRequest.findById(leave._id).populate('nurseId', 'name employeeId department designation');
        res.json({ message: `Leave request ${status.toLowerCase()} successfully`, leave: populated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
