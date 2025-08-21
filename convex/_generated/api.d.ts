/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as cashRegister from "../cashRegister.js";
import type * as categories from "../categories.js";
import type * as productGroups from "../productGroups.js";
import type * as production from "../production.js";
import type * as products from "../products.js";
import type * as sales from "../sales.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  cashRegister: typeof cashRegister;
  categories: typeof categories;
  productGroups: typeof productGroups;
  production: typeof production;
  products: typeof products;
  sales: typeof sales;
  seed: typeof seed;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
