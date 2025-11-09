import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import { getHostDashboardReport } from '../../services/reports/hostReports.service.js';

export const getHostDashboard = asyncHandler(async (req, res) => {
  const report = await getHostDashboardReport(req.user?._id);
  successResponse(res, report, 'Reporte del dashboard del anfitrión');
});

export default {
  getHostDashboard,
};


