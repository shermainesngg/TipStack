// Stub "server-only" so pipeline scripts can import from @/lib/supabase/queries
require.cache[require.resolve("server-only")] = {
  id: "server-only",
  filename: require.resolve("server-only"),
  loaded: true,
  exports: {},
};
