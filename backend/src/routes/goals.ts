import { supabase } from "../db.js";
import { ownedCollection } from "./owned-collection.js";

export default ownedCollection(supabase, {
  table: "goals",
  orderBy: { column: "createdAt", ascending: true },
  update: true,
});
