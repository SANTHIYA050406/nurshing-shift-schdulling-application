const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const { generateSchedule } = require('../services/scheduler.service');

// Generate schedule
router.post('/generate', async (req, res) => {
    try {
        const generatedSchedule = await generateSchedule(req.body);
        const schedule = new Schedule(generatedSchedule);
        const savedSchedule = await schedule.save();
        
        // Populate nurse details before sending response
        const populated = await Schedule.findById(savedSchedule._id)
            .populate('shifts.nurseId', 'name employeeId department designation');
            
        res.status(201).json(populated);
    } catch (err) {
        console.error('Error generating schedule:', err);
        res.status(400).json({ message: err.message });
    }
});

// Approve schedule
router.patch('/:id/approve', async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndUpdate(
            req.params.id, 
            { status: 'Approved' }, 
            { new: true }
        ).populate('shifts.nurseId', 'name employeeId department designation email');
        
        // Dispatch shift duty notification emails to all assigned nurses
        const { sendShiftDutyNotifications } = require('../services/email.service');
        const emailResults = await sendShiftDutyNotifications(schedule);

        res.json({
            schedule,
            emailNotifications: emailResults,
            message: `Schedule approved! Duty notification emails successfully dispatched to ${emailResults.count} nurses.`
        });
    } catch (err) {
        console.error('Error approving schedule & sending emails:', err);
        res.status(400).json({ message: err.message });
    }
});

// Get all schedules
router.get('/', async (req, res) => {
    try {
        const schedules = await Schedule.find()
            .populate('shifts.nurseId', 'name employeeId department designation contact')
            .sort({ createdAt: -1 });
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get upcoming shifts (Today, Tomorrow, and Week) for a specific nurse
router.get('/nurse/:nurseId/shifts', async (req, res) => {
    try {
        const { nurseId } = req.params;
        const schedules = await Schedule.find({
            'shifts.nurseId': nurseId
        }).populate('shifts.nurseId', 'name employeeId department designation contact');

        // Flatten all shifts for this nurse
        let nurseShifts = [];
        schedules.forEach(sched => {
            sched.shifts.forEach(shift => {
                if (shift.nurseId && shift.nurseId._id.toString() === nurseId) {
                    nurseShifts.push({
                        scheduleId: sched._id,
                        department: sched.department,
                        status: sched.status,
                        date: shift.date,
                        shiftType: shift.shiftType,
                        nurse: shift.nurseId
                    });
                }
            });
        });

        // Sort shifts by date
        nurseShifts.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json(nurseShifts);
    } catch (err) {
        console.error('Error fetching nurse shifts:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
