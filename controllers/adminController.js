import { usersCollection, doctorsCollection, appointmentsCollection, reviewsCollection } from '../utils/db.js';

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
