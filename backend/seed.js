const mongoose = require('mongoose');
const Nurse = require('./models/Nurse');
const Availability = require('./models/Availability');
const LeaveRequest = require('./models/LeaveRequest');
const Schedule = require('./models/Schedule');
const OvertimeAllocation = require('./models/OvertimeAllocation');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nursing_portal';

async function seedFourDepartmentsDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB. Resetting with 4 Departments (Normal Ward, ER, ICU, OP)...');

        // 1. Clear all existing collections
        await Promise.all([
            Nurse.deleteMany({}),
            Availability.deleteMany({}),
            LeaveRequest.deleteMany({}),
            Schedule.deleteMany({}),
            OvertimeAllocation.deleteMany({})
        ]);
        console.log('✓ Wiped old database collections.');

        // 2. Insert 20 Nurses (Exactly 5 per department across the 4 required departments)
        // Rule: In each department, 3 nurses are needed for a shift.
        const nursesData = [
            // ==================== 1. NORMAL WARD ====================
            { employeeId: 'N001', name: 'Ananya Sen', department: 'Normal Ward', designation: 'Senior Nurse', contact: '+91 98765 00001', maxWorkingHoursPerWeek: 40, preferredShift: 'Morning' },
            { employeeId: 'N002', name: 'Rajesh Gupta', department: 'Normal Ward', designation: 'Staff Nurse', contact: '+91 98765 00002', maxWorkingHoursPerWeek: 40, preferredShift: 'Morning' },
            { employeeId: 'N003', name: 'Kavita Sharma', department: 'Normal Ward', designation: 'Staff Nurse', contact: '+91 98765 00003', maxWorkingHoursPerWeek: 40, preferredShift: 'Morning' },
            { employeeId: 'N004', name: 'Manoj Kumar', department: 'Normal Ward', designation: 'Staff Nurse', contact: '+91 98765 00004', maxWorkingHoursPerWeek: 40, preferredShift: 'Evening' },
            { employeeId: 'N005', name: 'Preeti Singh', department: 'Normal Ward', designation: 'Staff Nurse', contact: '+91 98765 00005', maxWorkingHoursPerWeek: 40, preferredShift: 'Night' },

            // ==================== 2. ER (EMERGENCY ROOM) ====================
            { employeeId: 'N006', name: 'Suresh Raina', department: 'ER', designation: 'Staff Nurse', contact: '+91 98765 00006', maxWorkingHoursPerWeek: 40, preferredShift: 'Morning' },
            { employeeId: 'N007', name: 'Deepa Nair', department: 'ER', designation: 'Senior Nurse', contact: '+91 98765 00007', maxWorkingHoursPerWeek: 40, preferredShift: 'Morning' },
            { employeeId: 'N008', name: 'Ravi Teja', department: 'ER', designation: 'Staff Nurse', contact: '+91 98765 00008', maxWorkingHoursPerWeek: 40, preferredShift: 'Morning' },
            { employeeId: 'N009', name: 'Karthik Raman', department: 'ER', designation: 'Staff Nurse', contact: '+91 98765 00009', maxWorkingHoursPerWeek: 40, preferredShift: 'Evening' },
            { employeeId: 'N010', name: 'Shweta Tiwari', department: 'ER', designation: 'Staff Nurse', contact: '+91 98765 00010', maxWorkingHoursPerWeek: 40, preferredShift: 'Night' },

            // ==================== 3. ICU (INTENSIVE CARE UNIT) ====================
            { employeeId: 'N011', name: 'Priya Sharma', department: 'ICU', designation: 'Senior Nurse', contact: '+91 98765 00011', maxWorkingHoursPerWeek: 40, preferredShift: 'Morning' },
            { employeeId: 'N012', name: 'Anitha Reddy', department: 'ICU', designation: 'Staff Nurse', contact: '+91 98765 00012', maxWorkingHoursPerWeek: 40, preferredShift: 'Morning' },
            { employeeId: 'N013', name: 'Divya Kumar', department: 'ICU', designation: 'Staff Nurse', contact: '+91 98765 00013', maxWorkingHoursPerWeek: 40, preferredShift: 'Morning' },
            { employeeId: 'N014', name: 'Kavya Singh', department: 'ICU', designation: 'Staff Nurse', contact: '+91 98765 00014', maxWorkingHoursPerWeek: 40, preferredShift: 'Evening' },
            { employeeId: 'N015', name: 'Meera Patel', department: 'ICU', designation: 'Head Nurse', contact: '+91 98765 00015', maxWorkingHoursPerWeek: 40, preferredShift: 'Night' },

            // ==================== 4. OP (OUTPATIENT DEPARTMENT) ====================
            { employeeId: 'N016', name: 'Rahul Varma', department: 'OP', designation: 'Staff Nurse', contact: '+91 98765 00016', maxWorkingHoursPerWeek: 40, preferredShift: 'Morning' },
            { employeeId: 'N017', name: 'Pooja Iyer', department: 'OP', designation: 'Staff Nurse', contact: '+91 98765 00017', maxWorkingHoursPerWeek: 40, preferredShift: 'Morning' },
            { employeeId: 'N018', name: 'Sneha Roy', department: 'OP', designation: 'Senior Nurse', contact: '+91 98765 00018', maxWorkingHoursPerWeek: 40, preferredShift: 'Morning' },
            { employeeId: 'N019', name: 'Arvind Swamy', department: 'OP', designation: 'Senior Nurse', contact: '+91 98765 00019', maxWorkingHoursPerWeek: 40, preferredShift: 'Evening' },
            { employeeId: 'N020', name: 'Amit Verma', department: 'OP', designation: 'Staff Nurse', contact: '+91 98765 00020', maxWorkingHoursPerWeek: 40, preferredShift: 'Night' },
        ];

        const insertedNurses = await Nurse.insertMany(nursesData);
        console.log(`✓ Inserted ${insertedNurses.length} nurses (5 per department in Normal Ward, ER, ICU, OP).`);

        const map = {};
        insertedNurses.forEach(n => { map[n.employeeId] = n; });

        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // 3. Baseline Overtime Records (Allows crystal-clear ranking by lowest overtime)
        const overtimeData = [
            { nurseId: map['N015']._id, date: new Date(startOfDay.getTime() - 2 * 86400000), allocatedHours: 6, completedHours: 6, reason: 'ICU Critical Care Surge', allocatedBy: 'Hospital Admin', shiftPeriod: 'Night Extension', status: 'Accepted' },
            { nurseId: map['N007']._id, date: new Date(startOfDay.getTime() - 86400000), allocatedHours: 4, completedHours: 4, reason: 'ER Trauma Case Overtime', allocatedBy: 'Hospital Admin', shiftPeriod: 'Evening Extension', status: 'Accepted' },
            { nurseId: map['N012']._id, date: new Date(startOfDay.getTime() - 86400000), allocatedHours: 4, completedHours: 4, reason: 'ICU Continuous Dialysis Support', allocatedBy: 'Hospital Admin', shiftPeriod: 'Evening Extension', status: 'Accepted' },
            { nurseId: map['N005']._id, date: new Date(startOfDay.getTime() - 86400000), allocatedHours: 4, completedHours: 4, reason: 'Normal Ward Inpatient Admission Surge', allocatedBy: 'Hospital Admin', shiftPeriod: 'Night Extension', status: 'Accepted' },
            { nurseId: map['N020']._id, date: new Date(startOfDay.getTime() - 86400000), allocatedHours: 4, completedHours: 4, reason: 'OP Evening Clinic Extended Hours', allocatedBy: 'Hospital Admin', shiftPeriod: 'Evening Extension', status: 'Accepted' },
            { nurseId: map['N002']._id, date: new Date(startOfDay.getTime() - 86400000), allocatedHours: 2, completedHours: 2, reason: 'Normal Ward Late Discharge Handover', allocatedBy: 'Hospital Admin', shiftPeriod: 'Morning Extension', status: 'Accepted' },
            { nurseId: map['N006']._id, date: new Date(startOfDay.getTime() - 86400000), allocatedHours: 2, completedHours: 2, reason: 'ER Emergency Ambulance Transfer', allocatedBy: 'Hospital Admin', shiftPeriod: 'Evening Extension', status: 'Accepted' },
            { nurseId: map['N010']._id, date: new Date(startOfDay.getTime() - 86400000), allocatedHours: 2, completedHours: 2, reason: 'ER Triage Queue Clearance', allocatedBy: 'Hospital Admin', shiftPeriod: 'Morning Extension', status: 'Accepted' },
            { nurseId: map['N013']._id, date: new Date(startOfDay.getTime() - 86400000), allocatedHours: 2, completedHours: 2, reason: 'ICU Post-Operative Monitoring', allocatedBy: 'Hospital Admin', shiftPeriod: 'Morning Extension', status: 'Accepted' },
            { nurseId: map['N017']._id, date: new Date(startOfDay.getTime() - 86400000), allocatedHours: 2, completedHours: 2, reason: 'OP Consultation Overrun', allocatedBy: 'Hospital Admin', shiftPeriod: 'Morning Extension', status: 'Accepted' },
            // Lowest Overtime Nurses (0 hrs OT):
            // N004 (Normal Ward) - 0h OT
            // N009 (ER) - 0h OT
            // N014 (Kavya Singh - ICU) - 0h OT (⭐ Top substitute for ICU leave!)
            // N019 (OP) - 0h OT
        ];
        await OvertimeAllocation.insertMany(overtimeData);
        console.log(`✓ Inserted baseline overtime distribution.`);

        // 4. Sudden Medical Leave: Priya Sharma (N011) in ICU takes sudden leave today!
        // This drops ICU staffing from 3 to 2, triggering the automatic overtime allocation!
        const leaveData = [
            {
                nurseId: map['N011']._id, // Priya Sharma (ICU)
                startDate: new Date(startOfDay),
                endDate: new Date(endOfDay),
                reason: 'Sudden High Fever & Medical Emergency',
                status: 'Approved',
                appliedAt: new Date(),
                reviewedAt: new Date(),
                adminNotes: 'Sudden absence reported this morning. Urgent substitute needed to restore ICU requirement of 3 nurses!'
            },
            {
                nurseId: map['N004']._id, // Manoj Kumar (Normal Ward) - scheduled future leave
                startDate: new Date(startOfDay.getTime() + 3 * 86400000),
                endDate: new Date(startOfDay.getTime() + 5 * 86400000),
                reason: 'Family Event Leave',
                status: 'Pending',
                appliedAt: new Date()
            }
        ];
        await LeaveRequest.insertMany(leaveData);
        console.log(`✓ Inserted sudden leave record creating 1 nurse shortage in ICU.`);

        // 5. Shift Schedules: 3 Nurses required per department per shift
        const schedules = [
            // Normal Ward: 3 nurses scheduled on Morning shift
            {
                periodStart: new Date(startOfDay),
                periodEnd: new Date(startOfDay.getTime() + 6 * 86400000),
                department: 'Normal Ward',
                shifts: [
                    { date: new Date(startOfDay), shiftType: 'Morning', nurseId: map['N001']._id },
                    { date: new Date(startOfDay), shiftType: 'Morning', nurseId: map['N002']._id },
                    { date: new Date(startOfDay), shiftType: 'Morning', nurseId: map['N003']._id },
                    { date: new Date(startOfDay), shiftType: 'Evening', nurseId: map['N004']._id },
                    { date: new Date(startOfDay), shiftType: 'Night', nurseId: map['N005']._id }
                ],
                status: 'Approved'
            },
            // ER: 3 nurses scheduled on Morning shift
            {
                periodStart: new Date(startOfDay),
                periodEnd: new Date(startOfDay.getTime() + 6 * 86400000),
                department: 'ER',
                shifts: [
                    { date: new Date(startOfDay), shiftType: 'Morning', nurseId: map['N006']._id },
                    { date: new Date(startOfDay), shiftType: 'Morning', nurseId: map['N007']._id },
                    { date: new Date(startOfDay), shiftType: 'Morning', nurseId: map['N008']._id },
                    { date: new Date(startOfDay), shiftType: 'Evening', nurseId: map['N009']._id },
                    { date: new Date(startOfDay), shiftType: 'Night', nurseId: map['N010']._id }
                ],
                status: 'Approved'
            },
            // ICU: 3 nurses originally scheduled on Morning shift (N011 Priya Sharma, N012 Anitha Reddy, N013 Divya Kumar)
            // But Priya Sharma is on sudden leave, leaving only 2 on duty (1 deficit)!
            {
                periodStart: new Date(startOfDay),
                periodEnd: new Date(startOfDay.getTime() + 6 * 86400000),
                department: 'ICU',
                shifts: [
                    { date: new Date(startOfDay), shiftType: 'Morning', nurseId: map['N011']._id },
                    { date: new Date(startOfDay), shiftType: 'Morning', nurseId: map['N012']._id },
                    { date: new Date(startOfDay), shiftType: 'Morning', nurseId: map['N013']._id },
                    { date: new Date(startOfDay), shiftType: 'Evening', nurseId: map['N014']._id },
                    { date: new Date(startOfDay), shiftType: 'Night', nurseId: map['N015']._id }
                ],
                status: 'Approved'
            },
            // OP: 3 nurses scheduled on Morning shift
            {
                periodStart: new Date(startOfDay),
                periodEnd: new Date(startOfDay.getTime() + 6 * 86400000),
                department: 'OP',
                shifts: [
                    { date: new Date(startOfDay), shiftType: 'Morning', nurseId: map['N016']._id },
                    { date: new Date(startOfDay), shiftType: 'Morning', nurseId: map['N017']._id },
                    { date: new Date(startOfDay), shiftType: 'Morning', nurseId: map['N018']._id },
                    { date: new Date(startOfDay), shiftType: 'Evening', nurseId: map['N019']._id },
                    { date: new Date(startOfDay), shiftType: 'Night', nurseId: map['N020']._id }
                ],
                status: 'Approved'
            }
        ];
        await Schedule.insertMany(schedules);
        console.log(`✓ Inserted departmental schedules (3 nurses required per shift).`);

        // 6. Availability records for next 7 days
        const availabilities = [];
        for (const nurse of insertedNurses) {
            for (let i = 0; i < 7; i++) {
                const date = new Date(startOfDay);
                date.setDate(date.getDate() + i);
                const isLeaveToday = (nurse.employeeId === 'N011' && i === 0);
                availabilities.push({
                    nurseId: nurse._id,
                    date: date,
                    status: isLeaveToday ? 'Leave' : 'Available'
                });
            }
        }
        await Availability.insertMany(availabilities);
        console.log(`✓ Inserted ${availabilities.length} availability records.`);

        console.log('\n========================================================================');
        console.log('✅ Success: Normal Ward, ER, ICU, and OP Departments Seeded!');
        console.log('   - 3 Nurses Required Per Shift Enforced');
        console.log('   - ICU Sudden Leave Deficit Created (Priya Sharma)');
        console.log('   - Low-OT Substitute Ready for Overtime Allocation (Kavya Singh - 0h OT)');
        console.log('========================================================================\n');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

seedFourDepartmentsDatabase();
