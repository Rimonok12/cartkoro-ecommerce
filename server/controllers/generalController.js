const { District, Upazila } = require('../models/generalModels');

// Get districts with upazilas (status:true only, no status field in response)
const getDistrictsWithUpazilas = async (req, res) => {
  try {
    const districts = await District.find({ status: true }).select("_id name").lean();
    const upazilas = await Upazila.find({ status: true }).select("_id name district_id").lean();

    const result = districts.map(d => ({
      _id: d._id,
      name: d.name,
      upazilas: upazilas.filter(u => u.district_id.toString() === d._id.toString())
        .map(u => ({ _id: u._id, name: u.name }))
    }));

    res.json(result);
  } catch (error) {
    console.error("Get Districts+Upazilas Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


module.exports={getDistrictsWithUpazilas};