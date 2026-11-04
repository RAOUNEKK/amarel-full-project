// Delivery fee per city (wilaya), in DA. The server is the source of truth:
// the fee is looked up here when an order is created, never taken from the browser.
// The frontend has a copy of this list in frontend/src/data/delivery.ts so it can
// show the price before the order is sent. Keep both files in sync.
//
// The amounts below are PLACEHOLDERS, change them to your real delivery prices.
const ZONES = {
  A: 400, // Algiers and the surrounding area
  B: 600, // northern coast and big cities
  C: 800, // inland / high plateaus
  D: 1200, // far south
};

const CITIES = {
  A: ["Alger", "Blida", "Boumerdès", "Tipaza"],
  B: [
    "Oran", "Constantine", "Annaba", "Béjaïa", "Tizi Ouzou", "Sétif", "Skikda", "Jijel", "Mostaganem", "Chlef",
    "Aïn Defla", "Médéa", "Bouira", "Mila", "Guelma", "El Tarf", "Souk Ahras", "Tlemcen", "Aïn Témouchent",
    "Relizane", "Mascara", "Sidi Bel Abbès", "Bordj Bou Arréridj",
  ],
  C: [
    "Batna", "Biskra", "Tébessa", "Khenchela", "Oum El Bouaghi", "Djelfa", "Laghouat", "M'Sila", "Tiaret",
    "Tissemsilt", "Saïda", "Naâma", "El Bayadh", "Ouargla", "Ghardaïa", "El Oued",
  ],
  D: ["Béchar", "Adrar", "Tamanrasset", "Illizi", "Tindouf", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès", "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa"],
};

const DELIVERY = Object.entries(CITIES).flatMap(([zone, names]) => names.map((city) => ({ city, fee: ZONES[zone] })));

const norm = (s) => String(s || "").trim().toLowerCase();

// returns { city, fee } with the official spelling, or null when the city is not delivered
function findCity(name) {
  const hit = DELIVERY.find((c) => norm(c.city) === norm(name));
  return hit || null;
}

module.exports = { DELIVERY, findCity };
