import { usersCollection, doctorsCollection, appointmentsCollection, reviewsCollection, paymentsCollection } from '../utils/db.js';

// @desc    Get comprehensive dashboard statistics
// @route   GET /admin/stats
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Patients
    const totalPatients = await usersCollection.countDocuments({ role: 'patient' });

    // 2. Total Doctors (verified only)
    const totalDoctors = await doctorsCollection.countDocuments({ verificationStatus: 'verified' });

    // 3. Total Appointments
    const totalAppointments = await appointmentsCollection.countDocuments();

    // 4. Average Rating
    const avgRatingAgg = await reviewsCollection.aggregate([
      { $group: { _id: null, averageRating: { $avg: "$rating" } } }
    ]).toArray();
    const averageRating = avgRatingAgg.length > 0 ? parseFloat(avgRatingAgg[0].averageRating.toFixed(1)) : 0;

    // 5. Monthly Appointments Trend
    const appointmentTrendAgg = await appointmentsCollection.aggregate([
      {
        $addFields: {
          createdAtDate: {
            $convert: {
              input: "$createdAt",
              to: "date",
              onError: new Date(),
              onNull: new Date()
            }
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAtDate" },
          appointments: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const appointmentTrendData = appointmentTrendAgg.map(item => ({
      name: monthNames[item._id - 1] || 'Unknown',
      appointments: item.appointments
    }));

    // Fill missing months for better display (up to 6 months)
    if (appointmentTrendData.length === 0) {
      appointmentTrendData.push({ name: monthNames[new Date().getMonth()], appointments: 0 });
    }

    // 6. Revenue by Specialty
    const specialtyRevenueAgg = await appointmentsCollection.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: "$specialty",
          value: { $sum: { $toDouble: "$fee" } }
        }
      },
      { $sort: { value: -1 } }
    ]).toArray();

    const specialtyRevenueData = specialtyRevenueAgg.map(item => ({
      name: item._id || 'General',
      value: item.value || 0
    }));

    // 7. Top 7 Doctors by Performance
    const doctorPerformanceAgg = await reviewsCollection.aggregate([
      {
        $group: {
          _id: "$doctorName",
          rating: { $avg: "$rating" },
          reviewCount: { $sum: 1 }
        }
      },
      { $sort: { rating: -1, reviewCount: -1 } },
      { $limit: 7 }
    ]).toArray();

    const doctorPerformanceData = doctorPerformanceAgg.map(item => ({
      name: item._id || 'Unknown',
      rating: parseFloat(item.rating.toFixed(1))
    }));

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        averageRating,
        appointmentTrendData,
        specialtyRevenueData,
        doctorPerformanceData
      }
    });

  } catch (error) {
    console.error(`[Admin API] Error fetching dashboard stats:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// @desc    Get all doctors for Admin Manage Doctors (merged users + doctors collections)
// @route   GET /admin/doctors
export const getAllDoctorsAdmin = async (req, res) => {
  try {
    const pipeline = [
      {
        $match: { role: 'doctor' }
      },
      {
        $lookup: {
          from: 'doctors',
          let: { userEmail: { $toLower: "$email" } },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toLower: "$email" }, "$$userEmail"] } } }
          ],
          as: 'profileData'
        }
      },
      {
        $unwind: {
          path: "$profileData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ["$profileData.name", "$name"] },
          email: 1,
          specialty: { $ifNull: ["$profileData.specialty", { $ifNull: ["$profileData.specialization", "General"] }] },
          designation: { $ifNull: ["$profileData.designation", "Consultant"] },
          experience: { $ifNull: ["$profileData.experience", ""] },
          qualifications: { $ifNull: ["$profileData.qualifications", ""] },
          consultationFee: { $ifNull: ["$profileData.consultationFee", ""] },
          licenseNumber: { $ifNull: ["$profileData.licenseNumber", "N/A"] },
          verificationStatus: { $ifNull: ["$profileData.verificationStatus", "pending"] },
          status: { $ifNull: ["$status", "Active"] },
          createdAt: { $ifNull: ["$profileData.createdAt", "$createdAt"] },
          avatar: { $ifNull: ["$profileData.image", "$photoURL"] },
          doctorId: "$profileData._id"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ];

    const mergedDoctors = await usersCollection.aggregate(pipeline).toArray();

    res.status(200).json({
      success: true,
      data: mergedDoctors
    });

  } catch (error) {
    console.error(`[Admin API] Error fetching admin doctors:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
};

// @desc    Update doctor verification status (admin-only)
// @route   PATCH /admin/doctors/:email/verification
export const updateDoctorVerification = async (req, res) => {
  try {
    const email = req.params.email;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'verified', 'rejected', 'removed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${allowedStatuses.join(', ')}`
      });
    }

    // Verify user exists
    const user = await usersCollection.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') }, role: 'doctor' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Doctor user not found' });
    }

    // Fetch existing doctor profile or create one
    let doctorProfile = await doctorsCollection.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    
    if (!doctorProfile) {
      // Create bare minimum profile
      const newProfile = {
        name: user.name,
        email: user.email,
        specialty: "General",
        verificationStatus: status,
        verifiedBy: req.user?.email || 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await doctorsCollection.insertOne(newProfile);
    } else {
      // Validate transitions if profile exists
      const validTransitions = {
        pending:  ['verified', 'rejected'],
        verified: ['rejected', 'removed'],
        rejected: ['pending', 'verified'],  // allow re-review
        removed:  ['pending', 'verified']   // allow reinstatement
      };

      const allowed = validTransitions[doctorProfile.verificationStatus || 'pending'] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from '${doctorProfile.verificationStatus || 'pending'}' to '${status}'.`
        });
      }

      await doctorsCollection.updateOne(
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { 
          $set: { 
            verificationStatus: status,
            verifiedBy: req.user?.email || 'admin',
            updatedAt: new Date().toISOString()
          } 
        }
      );
    }

    res.status(200).json({ success: true, message: `Doctor status updated to ${status}` });

  } catch (error) {
    console.error(`[Admin API] Error updating doctor verification:`, error);
    res.status(500).json({
      success: false,
      message: 'Error updating verification status',
      error: error.message
    });
  }
};

// @desc    Get all payments for Admin Manage Payments
// @route   GET /admin/payments
export const getAllPaymentsAdmin = async (req, res) => {
  try {
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          let: { patientEmail: { $toLower: "$patientEmail" } },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toLower: "$email" }, "$$patientEmail"] } } }
          ],
          as: 'patientData'
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { doctorEmail: { $toLower: "$doctorEmail" } },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toLower: "$email" }, "$$doctorEmail"] } } }
          ],
          as: 'doctorData'
        }
      },
      {
        $unwind: { path: "$patientData", preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: "$doctorData", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          id: { $ifNull: ["$displayTransactionId", "$friendlyTxnId"] },
          patientName: { $ifNull: ["$patientData.name", "Unknown Patient"] },
          doctorName: { $ifNull: ["$doctorData.name", "Unknown Doctor"] },
          amount: { $ifNull: ["$amount", 0] },
          method: { $ifNull: ["$paymentMethod", "Unknown"] },
          cardType: { $ifNull: ["$cardType", "other"] },
          date: { $ifNull: ["$paymentDate", "$createdAt"] },
          status: { $ifNull: ["$status", "Pending"] },
          avatar: { $ifNull: ["$patientData.photoURL", ""] }
        }
      },
      {
        $sort: { date: -1 }
      }
    ];

    const payments = await paymentsCollection.aggregate(pipeline).toArray();

    res.status(200).json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error(`[Admin API] Error fetching admin payments:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};
