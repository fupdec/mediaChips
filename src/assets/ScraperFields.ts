const ScraperFields = [
  { name: "Birthday", oldKey: "birthday", type: "date", key: "birthday" },
  {
    name: "Year of career start",
    oldKey: "career_start",
    type: "number",
    key: "career_start_year",
  },
  {
    name: "Year of career end",
    oldKey: "career_end",
    type: "number",
    key: "career_end_year",
  },
  {
    name: "Ethnicity",
    oldKey: "ethnicity",
    type: "array",
    key: "ethnicity",
  },
  {
    name: "Eye color",
    oldKey: "eyes",
    type: "array",
    key: "eye_colour",
  },
  {
    name: "Hair colors",
    oldKey: "hair",
    type: "array",
    key: "hair_colour",
  },
  { name: "Height", oldKey: "height", type: "number", key: "height" },
  { name: "Weight", oldKey: "weight", type: "number", key: "weight" },
  { name: "Bra cups", oldKey: "cups", type: "array", key: "cupsize" },
  { name: "Bra size", oldKey: "bra", type: "number", key: "bra" },
  { name: "Waist size", oldKey: "waist", type: "number", key: "waist" },
  { name: "Hip size", oldKey: "hip", type: "number", key: "hips" },
  {
    name: "Natural breasts",
    oldKey: "boobs",
    type: "array",
    key: "fake_boobs",
  },
  { name: "Tattoos", oldKey: "tatoo", type: "string", key: "tattoos" },
]

export default ScraperFields