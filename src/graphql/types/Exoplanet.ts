import { builder } from "../builder";
import { exoplanets } from "../../db/schema";
import {
  getAllExoplanets,
  addExoplanet,
} from "../../services/exoplanetService";
import { GraphQLResolveInfo } from "graphql";
import { z } from "zod";
import { VALIDATION_MESSAGES } from "../../constants/messages";
import { CACHE_KEYS } from "../../constants/cacheKeys";

export type ExoplanetType = typeof exoplanets.$inferSelect;

// 1. The Secure Menu Object
export const ExoplanetObject = builder
  .objectRef<ExoplanetType>("Exoplanet")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      name: t.exposeString("name"),
      scientificName: t.exposeString("scientificName", { nullable: true }),
      imageUrl: t.exposeString("imageUrl", { nullable: true }),
      discoveredOn: t.exposeString("discoveredOn", { nullable: true }),
      discoveredBy: t.exposeString("discoveredBy", { nullable: true }),
      distanceFromEarthLy: t.exposeString("distanceFromEarthLy", {
        nullable: true,
      }),
      solarSystemName: t.exposeString("solarSystemName", { nullable: true }),
      leadResearcherId: t.exposeString("leadResearcherId", { nullable: true }),
    }),
  });

// 2. Attach Resolvers
builder.queryFields((t) => ({
  exoplanets: t.field({
    type: [ExoplanetObject],
    authScopes: { auth: true },
    resolve: async (parent, args, ctx, info: GraphQLResolveInfo) => {
      // 🚀 The industry standard for speed: Redis Caching!
      const CACHE_KEY = CACHE_KEYS.EXOPLANETS.ALL;
      
      const cachedPlanets = await ctx.redis.get<ExoplanetType[]>(CACHE_KEY);
      if (cachedPlanets) {
        console.log(`[REDIS] Cache Hit for ${CACHE_KEY}`);
        return cachedPlanets;
      }

      const planets = await getAllExoplanets();

      await ctx.redis.set(CACHE_KEY, planets, 3600);
      console.log(`[REDIS] Cache Miss. Populated ${CACHE_KEY}.`);

      return planets as ExoplanetType[];
    },
  }),
}));

// 3. Attach Mutations (Creating New Data)
builder.mutationFields((t) => ({
  addExoplanet: t.field({
    type: ExoplanetObject,
    args: {
      name: t.arg.string({
        required: true,
        validate: z.string().min(2, VALIDATION_MESSAGES.EXOPLANET.NAME_MIN),
      }),
      scientificName: t.arg.string({ required: false }),
      imageUrl: t.arg.string({
        required: false,
        validate: z.url(VALIDATION_MESSAGES.EXOPLANET.URL_INVALID).optional(),
      }),
      discoveredOn: t.arg.string({ required: false }),
      discoveredBy: t.arg.string({ required: false }),
      distanceFromEarthLy: t.arg.string({
        required: false,
        validate: z
          .string()
          .regex(
            /^\d+(\.\d+)?$/,
            VALIDATION_MESSAGES.EXOPLANET.DISTANCE_INVALID,
          )
          .optional(),
      }),
      solarSystemName: t.arg.string({ required: false }),
      leadResearcherId: t.arg.string({
        required: false,
        validate: z
          .uuid(VALIDATION_MESSAGES.EXOPLANET.RESEARCHER_ID_INVALID)
          .optional(),
      }),
    },
    authScopes: { auth: true },
    resolve: async (parent, args, ctx) => {
      const newPlanet = await addExoplanet({
        name: args.name,
        scientificName: args.scientificName,
        imageUrl: args.imageUrl,
        discoveredOn: args.discoveredOn,
        discoveredBy: args.discoveredBy,
        distanceFromEarthLy: args.distanceFromEarthLy,
        solarSystemName: args.solarSystemName,
        leadResearcherId: args.leadResearcherId,
      });

      // 🛡️ Safe Invalidation via the corrected factory key
      await ctx.redis.del(CACHE_KEYS.EXOPLANETS.ALL);
      console.log(`[REDIS] Invalidated ${CACHE_KEYS.EXOPLANETS.ALL}`);

      return newPlanet;
    },
  }),
}));
