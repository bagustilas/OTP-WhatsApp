const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SUPABASE_URL = process.env.API_URL;
const SUPABASE_KEY = process.env.API_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const getUser = async (user) => {
  const { data, err } = await supabase
    .from("api_users")
    .select("api_key,created_at")
    .eq("nohp", user);
  return data;
};

const UpdateUser = async (api, user) => {
  const { data, error } = await supabase
    .from("api_users")
    .update({ api_key: api })
    .eq("nohp", user);
};

const cekApiKey = async (key) => {
  const { data, err } = await supabase
    .from("api_users")
    .select("api_key,created_at")
    .eq("api_key", key);
  return data;
};

module.exports = {
    getUser,
    UpdateUser,
    cekApiKey
}