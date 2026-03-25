import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Fetches activities from all 4 APIs and syncs them into Supabase
// Call this per city to populate the activities table
// Deduplicates by name — won't insert if activity with same name+city exists

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

interface RawActivity {
  name: string;
  description: string;
  city: string;
  neighborhood?: string;
  category: string;
  tags: string[];
  latitude: number;
  longitude: number;
  image_url?: string;
  images?: string[];
  cost_tier?: string;
  duration_minutes?: number;
  experience_tag?: string;
  is_sidequest?: boolean;
  source: string;
}

async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'Weventr/1.0' } }
    );
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch { return null; }
}

async function fetchOpenTripMap(city: string, lat: number, lon: number): Promise<RawActivity[]> {
  try {
    const kinds = 'interesting_places,cultural,natural,foods,sport';
    const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=10000&lon=${lon}&lat=${lat}&kinds=${kinds}&rate=2&limit=25&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const places = await res.json();

    const results: RawActivity[] = [];
    for (const place of places.slice(0, 15)) {
      try {
        const dRes = await fetch(`https://api.opentripmap.com/0.1/en/places/xid/${place.xid}`);
        if (!dRes.ok) continue;
        const d = await dRes.json();
        if (!d.name) continue;

        const k = (d.kinds || '').split(',');
        const cat = k.includes('foods') ? 'food'
          : k.includes('cultural') ? 'culture'
          : k.includes('natural') ? 'nature'
          : k.includes('sport') ? 'adventure'
          : 'hidden-gem';

        results.push({
          name: d.name,
          description: d.wikipedia_extracts?.text?.slice(0, 500) || d.info?.descr?.slice(0, 500) || `A popular spot in ${city}.`,
          city,
          category: cat,
          tags: [cat, 'sidequest'],
          latitude: place.point.lat,
          longitude: place.point.lon,
          image_url: d.preview?.source || d.image || null,
          experience_tag: cat,
          is_sidequest: cat === 'hidden-gem',
          source: 'opentripmap',
        });
      } catch { continue; }
    }
    return results;
  } catch { return []; }
}

async function fetchFoursquare(city: string, lat: number, lon: number): Promise<RawActivity[]> {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=10000&categories=13000,10000,16000&limit=15&sort=RELEVANCE`;
    const res = await fetch(url, { headers: { 'Authorization': apiKey } });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.results || []).filter((p: any) => p.name).map((p: any) => {
      const cat = p.categories?.[0]?.name || '';
      const isFood = /restaurant|food|cafe|bar|bakery/i.test(cat);
      const tag = isFood ? 'food' : /museum|art|theater/i.test(cat) ? 'culture' : 'local-pick';

      return {
        name: p.name,
        description: `${cat} in ${p.location?.neighborhood || city}.`,
        city,
        neighborhood: p.location?.neighborhood || p.location?.cross_street,
        category: tag,
        tags: [tag, cat.toLowerCase()],
        latitude: p.geocodes?.main?.latitude || lat,
        longitude: p.geocodes?.main?.longitude || lon,
        cost_tier: p.price ? ['free', '$', '$$', '$$$', '$$$$'][Math.min(p.price, 4)] : null,
        experience_tag: tag,
        is_sidequest: false,
        source: 'foursquare',
      };
    });
  } catch { return []; }
}

async function fetchOverpass(city: string, lat: number, lon: number): Promise<RawActivity[]> {
  try {
    const query = `[out:json][timeout:10];(node["tourism"~"attraction|museum|viewpoint"](around:8000,${lat},${lon});node["amenity"~"marketplace|theatre"](around:8000,${lat},${lon});node["leisure"~"park|garden|beach_resort"](around:8000,${lat},${lon}););out body 15;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.elements || []).filter((el: any) => el.tags?.name).map((el: any) => {
      const t = el.tags;
      const cat = t.tourism === 'museum' ? 'culture' : t.tourism === 'viewpoint' ? 'nature' : t.amenity === 'marketplace' ? 'food' : t.leisure ? 'nature' : 'hidden-gem';

      return {
        name: t.name,
        description: t.description || t['name:en'] || `A ${cat} spot in ${city}.`,
        city,
        category: cat,
        tags: [cat],
        latitude: el.lat,
        longitude: el.lon,
        image_url: t.image || null,
        experience_tag: cat,
        is_sidequest: cat === 'hidden-gem',
        source: 'overpass',
      };
    });
  } catch { return []; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { city } = req.body;
  if (!city) return res.status(400).json({ error: 'Missing city' });

  const coords = await geocodeCity(city);
  if (!coords) return res.status(404).json({ error: `Could not geocode "${city}"` });

  // Fetch from all sources in parallel
  const [otm, fsq, osm] = await Promise.all([
    fetchOpenTripMap(city, coords.lat, coords.lon),
    fetchFoursquare(city, coords.lat, coords.lon),
    fetchOverpass(city, coords.lat, coords.lon),
  ]);

  const all = [...otm, ...fsq, ...osm];

  // Filter out haram/inappropriate content
  const BLOCKED = ['bar', 'pub', 'nightclub', 'club', 'lounge', 'brewery', 'winery', 'wine', 'beer', 'cocktail', 'alcohol', 'liquor', 'tavern', 'gambling', 'casino', 'strip', 'adult', 'hookah', 'pork', 'bacon'];
  const clean = all.filter(a => {
    const text = `${a.name} ${a.description} ${a.category} ${a.tags.join(' ')}`.toLowerCase();
    return !BLOCKED.some(kw => text.includes(kw));
  });

  // Deduplicate by normalized name
  const seen = new Set<string>();
  const unique = clean.filter(a => {
    const key = a.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Check existing activities in Supabase for this city
  const { data: existing } = await supabase
    .from('activities')
    .select('name')
    .eq('city', city);

  const existingNames = new Set((existing || []).map(e => e.name.toLowerCase()));

  // Filter to only new activities
  const newActivities = unique.filter(a => !existingNames.has(a.name.toLowerCase()));

  if (newActivities.length === 0) {
    return res.status(200).json({ message: 'No new activities to sync', existing: existingNames.size });
  }

  // Insert into Supabase
  const rows = newActivities.map(a => ({
    name: a.name,
    description: a.description,
    city: a.city,
    neighborhood: a.neighborhood || null,
    latitude: a.latitude,
    longitude: a.longitude,
    image_url: a.image_url || null,
    images: a.image_url ? [a.image_url] : [],
    is_sidequest: a.is_sidequest || false,
    experience_tag: a.experience_tag || null,
    cost_tier: a.cost_tier || null,
    tags: a.tags,
    source: a.source,
  }));

  const { data: inserted, error } = await supabase
    .from('activities')
    .insert(rows)
    .select();

  if (error) {
    console.error('Supabase insert error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({
    message: `Synced ${inserted?.length || 0} new activities for ${city}`,
    sources: { opentripmap: otm.length, foursquare: fsq.length, overpass: osm.length },
    inserted: inserted?.length || 0,
    skipped: unique.length - newActivities.length,
  });
}
