import { z } from 'zod';

export const elevationKeys = ['base', 'mid', 'peak'] as const;
export type ElevationKey = (typeof elevationKeys)[number];

const nullableNumber = z.number().finite().nullable();
const isoTimestamp = z.string().datetime({ offset: true });

export const resortMetadataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  state: z.string().min(2),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
  base_elevation_ft: z.number().finite(),
  mid_elevation_ft: z.number().finite(),
  peak_elevation_ft: z.number().finite(),
});

export const resortCatalogSchema = z.array(resortMetadataSchema);

const hourlyElevationSchema = z.object({
  elevation_ft: z.number().finite(),
  temperature_f: nullableNumber,
  apparent_temperature_f: nullableNumber,
  windspeed_mph: nullableNumber,
  windgusts_mph: nullableNumber,
  snowfall_in: nullableNumber,
  rain_in: nullableNumber,
  precipitation_in: nullableNumber,
  snow_depth_in: nullableNumber,
  visibility_mi: nullableNumber,
});

const hourlySnapshotSchema = z.object({
  time: z.string().min(1),
  cloud_cover_pct: nullableNumber,
  freezing_level_ft: nullableNumber,
  base: hourlyElevationSchema,
  mid: hourlyElevationSchema,
  peak: hourlyElevationSchema,
});

const dailyElevationSchema = z.object({
  elevation_ft: z.number().finite(),
  high_f: nullableNumber,
  low_f: nullableNumber,
  apparent_high_f: nullableNumber,
  apparent_low_f: nullableNumber,
  max_windspeed_mph: nullableNumber,
  max_windgusts_mph: nullableNumber,
  snowfall_in: nullableNumber,
  rain_in: nullableNumber,
  precipitation_in: nullableNumber,
  max_snow_depth_in: nullableNumber,
  min_visibility_mi: nullableNumber,
});

const dailyForecastSchema = z.object({
  date: z.string().min(1),
  cloud_cover_avg_pct: nullableNumber,
  avg_freezing_level_ft: nullableNumber,
  base: dailyElevationSchema,
  mid: dailyElevationSchema,
  peak: dailyElevationSchema,
});

const skiSnowSchema = z.object({
  snow_depth_base_in: nullableNumber,
  snow_depth_summit_in: nullableNumber,
  new_snow_24h_in: nullableNumber,
  new_snow_48h_in: nullableNumber,
  season_total_in: nullableNumber,
  conditions: z.string().nullable(),
});

const skiLiftsSchema = z.object({
  lifts_open: nullableNumber,
  lifts_total: nullableNumber,
  runs_open: nullableNumber,
  runs_total: nullableNumber,
  resort_status: z.string().nullable(),
});

const skiConditionsSchema = z.object({
  snow: skiSnowSchema.nullable(),
  lifts: skiLiftsSchema.nullable(),
  tweets: z.array(
    z.object({
      text: z.string(),
      created_at: z.string(),
      url: z.string().nullable(),
    }),
  ),
  fetched_at: z.string(),
  source: z.literal('ski-api'),
});

export const weatherMetadataSchema = z.object({
  source: z.literal('open-meteo'),
  fetched_at: isoTimestamp,
  model_run_at: isoTimestamp.nullable(),
});

export const resortConditionsSchema = z.object({
  resort: z.string().min(1),
  state: z.string().min(2),
  weather_metadata: weatherMetadataSchema,
  next_12_hours: z.array(hourlySnapshotSchema),
  forecast: z.array(dailyForecastSchema),
  ski_conditions: skiConditionsSchema.nullable(),
});

export type ResortMetadata = z.infer<typeof resortMetadataSchema>;
export type HourlyElevationData = z.infer<typeof hourlyElevationSchema>;
export type DailyElevationData = z.infer<typeof dailyElevationSchema>;
export type DailyForecast = z.infer<typeof dailyForecastSchema>;
export type WeatherMetadata = z.infer<typeof weatherMetadataSchema>;
export type ResortConditions = z.infer<typeof resortConditionsSchema>;
