/**
 * Dribbble API proxy — deploy this on val.town
 *
 * 1. Go to https://val.town
 * 2. Create a new val, paste this code
 * 3. Add a secret (upper-right → Secrets) named DRIBBBLE_TOKEN
 * 4. Deploy, then copy the URL (e.g. https://your-val.val.run)
 * 5. Update DRIBBBLE_PROXY_URL in Header.astro
 *
 * ---
 * To get a Dribbble token:
 *   1. Go to https://dribbble.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost&response_type=code
 *   2. After authorizing, copy the ?code=... from the URL
 *   3. Exchange it:
 *      curl -X POST https://dribbble.com/oauth/token \
 *        -d "client_id=..." \
 *        -d "client_secret=..." \
 *        -d "code=..." \
 *        -d "redirect_uri=http://localhost"
 *   4. Copy the access_token from the response into the DRIBBBLE_TOKEN secret
 */

const SHOTS_URL = 'https://api.dribbble.com/v2/user/shots'

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    })
  }

  try {
    const token = Deno.env.get('DRIBBBLE_TOKEN')
    if (!token) throw new Error('DRIBBBLE_TOKEN secret not set')

    const res = await fetch(`${SHOTS_URL}?per_page=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const shots = await res.json()
    const shots_count = Array.isArray(shots) ? shots.length : 0

    return new Response(JSON.stringify({ shots_count }), { headers })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers,
    })
  }
}
