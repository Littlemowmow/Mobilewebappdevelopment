import type { VercelRequest, VercelResponse } from '@vercel/node';

// Unified activity feed — aggregates OpenTripMap, Foursquare, Amadeus, and Overpass
// Returns normalized activity cards for the Discover swipe feed

interface Activity {
  id: string;
  source: 'opentripmap' | 'foursquare' | 'amadeus' | 'overpass';
  name: string;
  description: string;
  city: string;
  neighborhood?: string;
  category: string;
  tags: string[];
  latitude: number;
  longitude: number;
  image?: string;
  price?: string;
  rating?: number;
  duration?: string;
  url?: string;
}

// ========== OpenTripMap ==========
async function fetchOpenTripMap(city: string, lat: number, lon: number): Promise<Activity[]> {
  try {
    // Get places within 10km radius
    const radius = 10000;
    const kinds = 'interesting_places,cultural,natural,foods,amusements,sport,shops';
    const listUrl = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${lon}&lat=${lat}&kinds=${kinds}&rate=3&limit=20&format=json`;

    const listRes = await fetch(listUrl);
    if (!listRes.ok) return [];
    const places = await listRes.json();

    // Fetch details for top places (batch — max 10 to stay in rate limit)
    const detailed: Activity[] = [];
    for (const place of places.slice(0, 10)) {
      try {
        const detailRes = await fetch(`https://api.opentripmap.com/0.1/en/places/xid/${place.xid}`);
        if (!detailRes.ok) continue;
        const detail = await detailRes.json();

        const kinds = (detail.kinds || '').split(',');
        const category = kinds.includes('foods') ? 'Food'
          : kinds.includes('cultural') ? 'Culture'
          : kinds.includes('natural') ? 'Nature'
          : kinds.includes('amusements') ? 'Nightlife'
          : 'SideQuest';

        detailed.push({
          id: `otm_${place.xid}`,
          source: 'opentripmap',
          name: detail.name || place.name,
          description: detail.wikipedia_extracts?.text?.slice(0, 200) || detail.info?.descr?.slice(0, 200) || `A popular ${category.toLowerCase()} spot in ${city}.`,
          city,
          category,
          tags: [category, 'SideQuest'],
          latitude: place.point.lat,
          longitude: place.point.lon,
          image: detail.preview?.source || detail.image,
          rating: place.rate ? Math.min(10, place.rate + 5) : undefined,
          url: detail.url || detail.wikipedia,
        });
      } catch { continue; }
    }
    return detailed;
  } catch {
    return [];
  }
}

// ========== Foursquare ==========
async function fetchFoursquare(city: string, lat: number, lon: number): Promise<Activity[]> {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) return [];

  try {
    const categories = '13000,10000,16000,17000'; // Food, Arts, Landmarks, Sports
    const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=10000&categories=${categories}&limit=15&sort=RELEVANCE`;

    const res = await fetch(url, {
      headers: { 'Authorization': apiKey, 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.results || []).map((place: any) => {
      const cat = place.categories?.[0]?.name || 'Activity';
      const isFood = cat.toLowerCase().includes('restaurant') || cat.toLowerCase().includes('food') || cat.toLowerCase().includes('cafe');
      const isCulture = cat.toLowerCase().includes('museum') || cat.toLowerCase().includes('art') || cat.toLowerCase().includes('theater');

      return {
        id: `fsq_${place.fsq_id}`,
        source: 'foursquare' as const,
        name: place.name,
        description: `${cat} in ${place.location?.neighborhood || place.location?.locality || city}. ${place.description || ''}`.trim(),
        city,
        neighborhood: place.location?.neighborhood || place.location?.cross_street,
        category: isFood ? 'Food' : isCulture ? 'Culture' : 'SideQuest',
        tags: [isFood ? 'Food' : isCulture ? 'Culture' : 'SideQuest', cat],
        latitude: place.geocodes?.main?.latitude || lat,
        longitude: place.geocodes?.main?.longitude || lon,
        price: place.price ? '$'.repeat(place.price) : undefined,
      };
    });
  } catch {
    return [];
  }
}

// ========== Amadeus Tours & Activities ==========
async function fetchAmadeus(lat: number, lon: number, city: string): Promise<Activity[]> {
  const clientId = process.env.AMADEUS_API_KEY;
  const clientSecret = process.env.AMADEUS_API_SECRET;
  if (!clientId || !clientSecret) return [];

  try {
    // Get OAuth token
    const tokenRes = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    });
    if (!tokenRes.ok) return [];
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    // Fetch activities
    const url = `https://api.amadeus.com/v1/shopping/activities?latitude=${lat}&longitude=${lon}&radius=10`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.data || []).slice(0, 10).map((act: any) => ({
      id: `amd_${act.id}`,
      source: 'amadeus' as const,
      name: act.name,
      description: act.shortDescription || act.description?.slice(0, 200) || `An experience in ${city}.`,
      city,
      category: 'Activity',
      tags: ['Must Do', 'Activity'],
      latitude: act.geoCode?.latitude || lat,
      longitude: act.geoCode?.longitude || lon,
      image: act.pictures?.[0],
      price: act.price?.amount ? `$${Math.round(parseFloat(act.price.amount))}` : undefined,
      rating: act.rating ? parseFloat(act.rating) : undefined,
      duration: act.duration?.includes('H') ? act.duration.replace('PT', '').replace('H', 'h').replace('M', 'm').toLowerCase() : undefined,
      url: act.bookingLink,
    }));
  } catch {
    return [];
  }
}

// ========== Overpass (OpenStreetMap) ==========
async function fetchOverpass(lat: number, lon: number, city: string): Promise<Activity[]> {
  try {
    const radius = 8000;
    const query = `
      [out:json][timeout:10];
      (
        node["tourism"~"attraction|museum|viewpoint|artwork"](around:${radius},${lat},${lon});
        node["amenity"~"marketplace|theatre|nightclub|pub"](around:${radius},${lat},${lon});
        node["leisure"~"park|garden|beach_resort"](around:${radius},${lat},${lon});
      );
      out body 20;
    `;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.elements || [])
      .filter((el: any) => el.tags?.name)
      .map((el: any) => {
        const tags = el.tags;
        const tourism = tags.tourism || '';
        const amenity = tags.amenity || '';
        const leisure = tags.leisure || '';

        const category = tourism === 'museum' ? 'Culture'
          : tourism === 'viewpoint' ? 'Views'
          : amenity === 'marketplace' ? 'Food'
          : amenity === 'nightclub' || amenity === 'pub' ? 'Nightlife'
          : leisure === 'park' || leisure === 'garden' ? 'Nature'
          : leisure === 'beach_resort' ? 'Nature'
          : 'SideQuest';

        return {
          id: `osm_${el.id}`,
          source: 'overpass' as const,
          name: tags.name,
          description: tags.description || tags['name:en'] || `A ${category.toLowerCase()} spot in ${city}.`,
          city,
          category,
          tags: [category, tourism || amenity || leisure].filter(Boolean),
          latitude: el.lat,
          longitude: el.lon,
          image: tags.image || tags.wikimedia_commons,
          url: tags.website || tags.url,
        };
      });
  } catch {
    return [];
  }
}

// ========== Geocode city name to lat/lon ==========
async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'Weventr/1.0' } }
    );
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// ========== Deduplicate by name similarity ==========
function deduplicateActivities(activities: Activity[]): Activity[] {
  const seen = new Map<string, Activity>();
  for (const act of activities) {
    const key = act.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    if (!seen.has(key)) {
      seen.set(key, act);
    }
  }
  return Array.from(seen.values());
}

// ========== Main Handler ==========
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const city = (req.query.city as string) || '';
  if (!city) {
    return res.status(400).json({ error: 'Missing city parameter' });
  }

  // Geocode the city
  const coords = await geocodeCity(city);
  if (!coords) {
    return res.status(404).json({ error: `Could not find coordinates for "${city}"` });
  }

  // Fetch from all sources in parallel
  const [otmResults, fsqResults, amdResults, osmResults] = await Promise.all([
    fetchOpenTripMap(city, coords.lat, coords.lon),
    fetchFoursquare(city, coords.lat, coords.lon),
    fetchAmadeus(coords.lat, coords.lon, city),
    fetchOverpass(coords.lat, coords.lon, city),
  ]);

  // Combine and deduplicate
  const all = [...otmResults, ...fsqResults, ...amdResults, ...osmResults];
  const unique = deduplicateActivities(all);

  // Shuffle for variety
  const shuffled = unique.sort(() => Math.random() - 0.5);

  // Set cache header (cache for 1 hour)
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  return res.status(200).json({
    city,
    coordinates: coords,
    count: shuffled.length,
    sources: {
      opentripmap: otmResults.length,
      foursquare: fsqResults.length,
      amadeus: amdResults.length,
      overpass: osmResults.length,
    },
    activities: shuffled,
  });
}
