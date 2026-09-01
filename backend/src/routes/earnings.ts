import { supabase } from "../db.js";
import { ownedCollection } from "./owned-collection.js";

export default ownedCollection(supabase, {
  table: "earnings",
  orderBy: { column: "date", ascending: false },
});
