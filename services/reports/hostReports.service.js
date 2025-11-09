import { addDays, startOfMonth, startOfYear, subDays, subMonths, subYears } from 'date-fns';
import mongoose from 'mongoose';
import Booking from '../../models/Booking.js';
import Listing from '../../models/Listing.js';
import Review from '../../models/Review.js';
import { BOOKING_STATUS } from '../../utils/constants.js';

const SUCCESSFUL_BOOKING_STATUSES = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.ACTIVE,
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.PAID_OUT,
];

const PENDING_BOOKING_STATUSES = [BOOKING_STATUS.PENDING_APPROVAL];

const WINDOW_DAYS_SHORT = 30;
const MONTH_RANGE = 12;

const bookingDurationExpression = {
  $max: [
    1,
    {
      $add: [
        {
          $dateDiff: {
            startDate: '$startDate',
            endDate: '$endDate',
            unit: 'day',
          },
        },
        0,
      ],
    },
  ],
};

const buildMonthRange = (count, reference) => {
  const months = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    });
  }
  return months;
};

const monthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

const percentageChange = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? 1 : 0;
  }
  return (current - previous) / previous;
};

const average = (values = []) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const safeNumber = (value) => (Number.isFinite(value) ? value : 0);

const emptyReport = () => ({
  stats: {
    totalEarnings: 0,
    earningsGrowth: 0,
    occupancyRate: 0,
    averageRating: 0,
    reviewCount: 0,
    pendingApprovals: 0,
    activeListings: 0,
    totalBookings: 0,
    regionPercentile: 0,
  },
  revenueTrend: [],
  upcomingBookings: [],
  actionItems: [],
  analytics: {
    highlights: [],
    occupancyTrend: [],
    yoyRevenue: [],
    regionalComparison: null,
    pricingRecommendations: [],
    insights: [],
  },
});

export const getHostDashboardReport = async (hostId) => {
  if (!hostId) {
    return emptyReport();
  }

  const now = new Date();
  const twelveMonthsAgo = startOfMonth(subMonths(now, MONTH_RANGE - 1));
  const twoYearsAgo = startOfYear(subYears(now, 2));
  const windowStart = subDays(now, WINDOW_DAYS_SHORT);

  const listings = await Listing.find({ host: hostId }).select(
    '_id title pricing.hourlyRate pricing.dailyRate address.city stats views bookings'
  );

  if (!listings.length) {
    return emptyReport();
  }

  const listingIds = listings.map((listing) => listing._id);
  const listingIdStrings = listingIds.map((id) => id.toString());
  const listingById = new Map(listings.map((listing) => [listing._id.toString(), listing]));

  const activeCities = Array.from(
    new Set(
      listings
        .map((listing) => listing.address?.city)
        .filter((city) => typeof city === 'string' && city.trim().length)
    )
  );

  const [
    monthlyPerformance,
    yearlyPerformance,
    occupancyByListingWindow,
    regionalListings,
    regionalOccupancyWindow,
    reviewStats,
    pendingApprovals,
    totalBookings,
    upcomingBookingsRaw,
  ] = await Promise.all([
    Booking.aggregate([
      {
        $match: {
          listing: { $in: listingIds },
          status: { $in: SUCCESSFUL_BOOKING_STATUSES },
          startDate: { $gte: twelveMonthsAgo },
        },
      },
      {
        $addFields: {
          bookingDays: bookingDurationExpression,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$startDate' },
            month: { $month: '$startDate' },
          },
          revenue: { $sum: '$pricing.hostPayout' },
          bookingDays: { $sum: '$bookingDays' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Booking.aggregate([
      {
        $match: {
          listing: { $in: listingIds },
          status: { $in: SUCCESSFUL_BOOKING_STATUSES },
          startDate: { $gte: twoYearsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$startDate' },
          },
          revenue: { $sum: '$pricing.hostPayout' },
        },
      },
      { $sort: { '_id.year': 1 } },
    ]),
    Booking.aggregate([
      {
        $match: {
          listing: { $in: listingIds },
          status: { $in: SUCCESSFUL_BOOKING_STATUSES },
          startDate: { $gte: windowStart },
        },
      },
      {
        $addFields: {
          bookingDays: bookingDurationExpression,
        },
      },
      {
        $group: {
          _id: '$listing',
          bookingDays: { $sum: '$bookingDays' },
          avgPayout: { $avg: '$pricing.hostPayout' },
        },
      },
    ]),
    activeCities.length
      ? Listing.find({ 'address.city': { $in: activeCities } }).select('_id address.city pricing.hourlyRate')
      : [],
    activeCities.length
      ? Booking.aggregate([
          {
            $match: {
              startDate: { $gte: windowStart },
              status: { $in: SUCCESSFUL_BOOKING_STATUSES },
            },
          },
          {
            $addFields: {
              bookingDays: bookingDurationExpression,
            },
          },
          {
            $group: {
              _id: '$listing',
              bookingDays: { $sum: '$bookingDays' },
            },
          },
        ])
      : [],
    Review.aggregate([
      {
        $match: {
          reviewType: 'host',
          reviewee: new mongoose.Types.ObjectId(hostId),
        },
      },
      {
        $group: {
          _id: null,
          ratingAverage: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]),
    Booking.countDocuments({
      listing: { $in: listingIds },
      status: { $in: PENDING_BOOKING_STATUSES },
    }),
    Booking.countDocuments({
      listing: { $in: listingIds },
      status: { $in: SUCCESSFUL_BOOKING_STATUSES },
    }),
    Booking.find({
      listing: { $in: listingIds },
      status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ACTIVE] },
      startDate: { $gte: now },
    })
      .populate('listing', 'title address.city pricing')
      .populate('driver', 'firstName lastName')
      .sort({ startDate: 1 })
      .limit(5),
  ]);

  const monthRange = buildMonthRange(MONTH_RANGE, now);
  const monthlyMap = new Map(
    monthlyPerformance.map((entry) => [
      monthKey(entry._id.year, entry._id.month),
      {
        revenue: safeNumber(entry.revenue),
        bookingDays: safeNumber(entry.bookingDays),
      },
    ])
  );

  const chartRevenueTrend = monthRange.map(({ year, month }) => {
    const entry = monthlyMap.get(monthKey(year, month)) || { revenue: 0, bookingDays: 0 };
    return {
      year,
      month,
      total: entry.revenue,
      bookingDays: entry.bookingDays,
    };
  });

  const occupancyTrend = chartRevenueTrend.map((entry) => {
    const daysInMonth = new Date(entry.year, entry.month, 0).getDate();
    const theoreticalCapacity = listings.length * daysInMonth;
    const occupancy = theoreticalCapacity
      ? Math.min(1, entry.bookingDays / theoreticalCapacity)
      : 0;
    return {
      year: entry.year,
      month: entry.month,
      occupancy,
    };
  });

  const currentRevenue = chartRevenueTrend[chartRevenueTrend.length - 1]?.total || 0;
  const previousRevenue = chartRevenueTrend[chartRevenueTrend.length - 2]?.total || 0;
  const totalEarnings = chartRevenueTrend.reduce((sum, entry) => sum + entry.total, 0);
  const yoyRevenue = yearlyPerformance.map((entry) => ({
    year: entry._id.year,
    total: safeNumber(entry.revenue),
  }));

  const currentYear = new Date().getFullYear();
  const currentYearRevenue = yoyRevenue.find((item) => item.year === currentYear)?.total || 0;
  const previousYearRevenue =
    yoyRevenue.find((item) => item.year === currentYear - 1)?.total || 0;
  const yoyChange = percentageChange(currentYearRevenue, previousYearRevenue);

  const occupancyMapByListing = new Map(
    occupancyByListingWindow.map((entry) => [
      entry._id.toString(),
      {
        bookingDays: safeNumber(entry.bookingDays),
        avgPayout: safeNumber(entry.avgPayout),
      },
    ])
  );

  const hostListingAnalytics = listingIdStrings.map((listingId) => {
    const listing = listingById.get(listingId);
    const occupancyStats = occupancyMapByListing.get(listingId) || {
      bookingDays: 0,
      avgPayout: 0,
    };
    const occupancyRate = Math.min(
      1,
      WINDOW_DAYS_SHORT ? occupancyStats.bookingDays / WINDOW_DAYS_SHORT : 0
    );
    const currentRate = safeNumber(listing.pricing?.hourlyRate || listing.pricing?.dailyRate || 0);

    return {
      listingId,
      title: listing.title,
      city: listing.address?.city || 'Sin ciudad',
      occupancyRate,
      avgPayout: occupancyStats.avgPayout,
      currentRate,
    };
  });

  const averageOccupancyHost = average(hostListingAnalytics.map((entry) => entry.occupancyRate));
  const topListing = hostListingAnalytics.reduce(
    (top, current) => (current.occupancyRate > (top?.occupancyRate ?? 0) ? current : top),
    null
  );

  // Regional performance
  const regionalListingMap = new Map(
    regionalListings.map((listing) => [listing._id.toString(), listing.address?.city || 'Sin ciudad'])
  );
  const regionalListingIdsSet = new Set(regionalListings.map((listing) => listing._id.toString()));
  const regionalOccupancyMap = new Map(
    regionalOccupancyWindow
      .filter((entry) => regionalListingIdsSet.has(entry._id.toString()))
      .map((entry) => [
        entry._id.toString(),
        safeNumber(entry.bookingDays),
      ])
  );

  const cityBreakdown = new Map();

  hostListingAnalytics.forEach((item) => {
    const city = item.city || 'Sin ciudad';
    if (!cityBreakdown.has(city)) {
      cityBreakdown.set(city, {
        city,
        hostOccupancyValues: [],
        marketOccupancyValues: [],
      });
    }
    const record = cityBreakdown.get(city);
    record.hostOccupancyValues.push(item.occupancyRate);
  });

  regionalListings.forEach((listing) => {
    const key = listing._id.toString();
    const city = regionalListingMap.get(key) || 'Sin ciudad';
    if (!cityBreakdown.has(city)) {
      cityBreakdown.set(city, {
        city,
        hostOccupancyValues: [],
        marketOccupancyValues: [],
      });
    }
    const record = cityBreakdown.get(city);
    const bookingDays = regionalOccupancyMap.get(key) || 0;
    const occupancyRate = Math.min(
      1,
      WINDOW_DAYS_SHORT ? bookingDays / WINDOW_DAYS_SHORT : 0
    );
    record.marketOccupancyValues.push(occupancyRate);
  });

  const regionalComparison = {
    windowDays: WINDOW_DAYS_SHORT,
    averageHostOccupancy: averageOccupancyHost,
    averageMarketOccupancy: 0,
    percentile: 0,
    cities: [],
  };

  const allMarketOccupancies = [];

  cityBreakdown.forEach((record) => {
    const hostAverageCity = average(record.hostOccupancyValues);
    const marketAverageCity = average(record.marketOccupancyValues);
    regionalComparison.cities.push({
      city: record.city,
      hostOccupancy: hostAverageCity,
      marketOccupancy: marketAverageCity,
      delta: hostAverageCity - marketAverageCity,
    });
    if (marketAverageCity) {
      allMarketOccupancies.push(marketAverageCity);
    }
  });

  regionalComparison.averageMarketOccupancy = average(allMarketOccupancies);

  const allOccupancySamples = [
    ...allMarketOccupancies,
    ...hostListingAnalytics.map((item) => item.occupancyRate),
  ].filter((value) => Number.isFinite(value));

  if (allOccupancySamples.length) {
    const sortedSamples = [...allOccupancySamples].sort((a, b) => a - b);
    const hostPosition = sortedSamples.findIndex((value) => value >= averageOccupancyHost);
    const percentile = Math.round(
      ((hostPosition === -1 ? sortedSamples.length - 1 : hostPosition) / sortedSamples.length) * 100
    );
    regionalComparison.percentile = percentile;
  }

  const pricingRecommendations = hostListingAnalytics
    .map((listingStat) => {
      const { currentRate } = listingStat;
      if (!currentRate || currentRate <= 0) {
        return null;
      }

      let recommendedRate = currentRate;
      let rationale = 'Mantén la tarifa actual, rendimiento estable.';

      if (listingStat.occupancyRate >= 0.85) {
        recommendedRate = currentRate * 1.12;
        rationale = 'Ocupación muy alta: incrementa tarifas para capturar valor adicional.';
      } else if (listingStat.occupancyRate <= 0.35) {
        recommendedRate = currentRate * 0.88;
        rationale = 'Ocupación baja: considera promociones o ajustar tarifas.';
      }

      const currentRounded = Number(currentRate.toFixed(2));
      const recommendedRounded = Number(recommendedRate.toFixed(2));
      const delta = currentRounded ? (recommendedRounded - currentRounded) / currentRounded : 0;

      return {
        listingId: listingStat.listingId,
        listingTitle: listingStat.title,
        city: listingStat.city,
        currentRate: currentRounded,
        recommendedRate: recommendedRounded,
        occupancyRate: listingStat.occupancyRate,
        delta,
        rationale,
      };
    })
    .filter(Boolean);

  const insights = [];

  if (yoyChange >= 0) {
    insights.push({
      id: 'yoy-positive',
      title: 'Ingresos en crecimiento',
      description: `Los ingresos del ${currentYear} superan al año anterior en ${(yoyChange * 100).toFixed(
        1
      )}%`,
      tone: 'positive',
    });
  } else {
    insights.push({
      id: 'yoy-negative',
      title: 'Disminución de ingresos interanual',
      description: `Los ingresos del ${currentYear} están ${(Math.abs(yoyChange) * 100).toFixed(
        1
      )}% por debajo de ${currentYear - 1}. Ajusta promociones o campañas.`,
      tone: 'warning',
    });
  }

  if (regionalComparison.cities.length) {
    const strongestCity = regionalComparison.cities.reduce((best, current) => {
      if (!best) return current;
      return current.delta > best.delta ? current : best;
    }, null);

    if (strongestCity && strongestCity.delta >= 0) {
      insights.push({
        id: 'city-standout',
        title: `Destacado en ${strongestCity.city}`,
        description: `Tus listados en ${strongestCity.city} superan al mercado por ${(strongestCity.delta * 100).toFixed(
          1
        )} puntos de ocupación.`,
        tone: 'positive',
      });
    } else if (strongestCity) {
      insights.push({
        id: 'city-opportunity',
        title: `Oportunidad en ${strongestCity.city}`,
        description: `Tus listados en ${strongestCity.city} están ${(Math.abs(strongestCity.delta) * 100).toFixed(
          1
        )} puntos por debajo de la media. Revisa tarifas o campañas.`,
        tone: 'warning',
      });
    }
  }

  if (topListing) {
    insights.push({
      id: 'top-listing',
      title: `${topListing.title} es el más demandado`,
      description: `Ocupación del ${(topListing.occupancyRate * 100).toFixed(
        0
      )}% en los últimos ${WINDOW_DAYS_SHORT} días.`,
      tone: 'info',
    });
  }

  const highlightCards = [
    {
      id: 'highlight-yoy',
      title: 'Crecimiento Y/Y',
      value: `${(yoyChange * 100).toFixed(1)}%`,
      description: `Comparado con ${currentYear - 1}`,
      trend: yoyChange,
      tone: yoyChange >= 0 ? 'positive' : 'negative',
    },
    {
      id: 'highlight-occupancy',
      title: 'Ocupación promedio',
      value: `${Math.round(averageOccupancyHost * 100)}%`,
      description: `Últimos ${WINDOW_DAYS_SHORT} días`,
      trend: averageOccupancyHost - regionalComparison.averageMarketOccupancy,
      tone: averageOccupancyHost >= regionalComparison.averageMarketOccupancy ? 'positive' : 'warning',
    },
    {
      id: 'highlight-rate',
      title: 'Tarifa promedio',
      value: `$${average(
        hostListingAnalytics
          .map((item) => item.currentRate)
          .filter((rate) => Number.isFinite(rate) && rate > 0)
      ).toFixed(2)} / h`,
      description: 'Promedio ponderado de tus listados',
      trend: 0,
      tone: 'neutral',
    },
  ];

  const actionItems = [];

  if (pendingApprovals > 0) {
    actionItems.push({
      id: 'pending-approvals',
      title: 'Revisa reservas pendientes',
      subtitle: `${pendingApprovals} solicitudes necesitan tu decisión`,
      dueDate: addDays(now, 1),
      type: 'approval',
    });
  }

  const underperformingListing = pricingRecommendations.find((item) => item.delta < -0.05);
  if (underperformingListing) {
    actionItems.push({
      id: 'pricing-adjust',
      title: `Refina tarifas en ${underperformingListing.listingTitle}`,
      subtitle: 'La ocupación es baja, considera promociones o paquetes',
      dueDate: addDays(now, 3),
      type: 'reminder',
    });
  }

  if (regionalComparison.averageMarketOccupancy > averageOccupancyHost) {
    actionItems.push({
      id: 'occupancy-gap',
      title: 'Cierra la brecha de ocupación',
      subtitle: 'Lanza campañas locales o ajusta disponibilidad para igualar al mercado',
      dueDate: addDays(now, 5),
      type: 'checkin',
    });
  }

  const upcomingBookings = upcomingBookingsRaw.map((booking) => ({
    id: booking._id.toString(),
    listingTitle: booking.listing?.title || 'Espacio',
    startDate: booking.startDate,
    endDate: booking.endDate,
    driverName: booking.driver
      ? `${booking.driver.firstName || ''} ${booking.driver.lastName || ''}`.trim() || 'Cliente'
      : 'Cliente',
    city: booking.listing?.address?.city || null,
    total: booking.pricing?.hostPayout || booking.pricing?.total || 0,
  }));

  const ratingStats = reviewStats[0] || { ratingAverage: 0, reviewCount: 0 };

  return {
    stats: {
      totalEarnings,
      earningsGrowth: percentageChange(currentRevenue, previousRevenue),
      occupancyRate: averageOccupancyHost,
      averageRating: ratingStats.ratingAverage || 0,
      reviewCount: ratingStats.reviewCount || 0,
      pendingApprovals,
      activeListings: listings.length,
      totalBookings,
      regionPercentile: regionalComparison.percentile,
    },
    revenueTrend: chartRevenueTrend,
    upcomingBookings,
    actionItems,
    analytics: {
      highlights: highlightCards,
      occupancyTrend,
      yoyRevenue,
      regionalComparison,
      pricingRecommendations,
      insights,
    },
  };
};

export default getHostDashboardReport;


