const COUNTRY_DELIMITER = '\x1E'

function serializeCountries(countries) {
  if (!countries || !countries.length) return null
  return countries.join(COUNTRY_DELIMITER)
}

module.exports = {
  COUNTRY_DELIMITER,
  serializeCountries,
}
