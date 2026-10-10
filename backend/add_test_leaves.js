const mongoose = require('mongoose');
const Nurse = require('./models/Nurse');
const LeaveRequest = require('./models/LeaveRequest');
const Schedule = require('./models/Schedule');

async function addTestLeaves() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/nursing_portal');
        console.log('Connected to MongoDB.');

        const nRajesh = await Nurse.findOne({ employeeId: 'N002' }); // Normal Ward
        const nSuresh = await Nurse.findOne({ employeeId: 'N006' }); // ER
        const nPooja = await Nurse.findOne({ employeeId: 'N017' });  // OP

        if (!nRajesh || !nSuresh || !nPooja) {
            console.error('Could not find all 3 test nurses.');
            process.exit(1);
        }

        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Leave for Rajesh Gupta (Normal Ward) -> PENDING
        const l1 = new LeaveRequest({
            nurseId: nRajesh._id,
            startDate: startOfDay,
            endDate: endOfDay,
            reason: 'Severe Migraine & Eye Strain',
            status: 'Pending',
            appliedAt: new Date()
        });
        await l1.save();

        // 2. Leave for Suresh Raina (ER) -> APPROVED
        const l2 = new LeaveRequest({
            nurseId: nSuresh._id,
            startDate: startOfDay,
            endDate: endOfDay,
            reason: 'Emergency Family Medical Leave',
            status: 'Approved',
            appliedAt: new Date(),
            reviewedAt: new Date(),
            adminNotes: 'Emergency leave approved by Admin. Coverage substitute needed in ER.'
        });
        await l2.save();

        // As per the rule: Since Suresh's leave is APPROVED, remove him from the Schedule!
        const schedules = await Schedule.find({
            'shifts.nurseId': nSuresh._id,
            'shifts.date': { $gte: startOfDay, $lte: endOfDay }
        });
        for (const sched of schedules) {
            sched.shifts = sched.shifts.filter(s => {
                const sDate = new Date(s.date);
                return !(s.nurseId.toString() === nSuresh._id.toString() && sDate >= startOfDay && sDate <= endOfDay);
            });
            await sched.save();
        }

        // 3. Leave for Pooja Iyer (OP) -> PENDING
        const l3 = new LeaveRequest({
            nurseId: nPooja._id,
            startDate: startOfDay,
            endDate: endOfDay,
            reason: 'Acute Food Poisoning & Fever',
            status: 'Pending',
            appliedAt: new Date()
        });
        await l3.save();

        console.log('\n================================================================');
        console.log('✓ Successfully Added 3 Test Leaves:');
        console.log('  1. Rajesh Gupta (N002, Normal Ward) -> PENDING (Still on auto schedule)');
        console.log('  2. Suresh Raina (N006, ER)          -> APPROVED (Removed from auto schedule!)');
        console.log('  3. Pooja Iyer   (N017, OP)           -> PENDING (Still on auto schedule)');
        console.log('================================================================\n');

        process.exit(0);
    } catch (err) {
        console.error('Error adding test leaves:', err);
        process.exit(1);
    }
}

addTestLeaves();
