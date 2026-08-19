const STATE_NAMES = {
  al: "Alabama", ak: "Alaska", az: "Arizona", ar: "Arkansas",
  ca: "California", co: "Colorado", ct: "Connecticut", de: "Delaware",
  fl: "Florida", ga: "Georgia", hi: "Hawaii", id: "Idaho",
  il: "Illinois", in: "Indiana", ia: "Iowa", ks: "Kansas",
  ky: "Kentucky", la: "Louisiana", me: "Maine", md: "Maryland",
  ma: "Massachusetts", mi: "Michigan", mn: "Minnesota", ms: "Mississippi",
  mo: "Missouri", mt: "Montana", ne: "Nebraska", nv: "Nevada",
  nh: "New Hampshire", nj: "New Jersey", nm: "New Mexico", ny: "New York",
  nc: "North Carolina", nd: "North Dakota", oh: "Ohio", ok: "Oklahoma",
  or: "Oregon", pa: "Pennsylvania", ri: "Rhode Island", sc: "South Carolina",
  sd: "South Dakota", tn: "Tennessee", tx: "Texas", ut: "Utah",
  vt: "Vermont", va: "Virginia", wa: "Washington", wv: "West Virginia",
  wi: "Wisconsin", wy: "Wyoming"
};

function parseStateDistrict(ocdId) {
  const state = ocdId.match(/\/state:([a-z]{2})(?:\/|$)/i)?.[1].toLowerCase();
  const lower = ocdId.match(/\/sldl:([^/]+)/i)?.[1];
  const upper = ocdId.match(/\/sldu:([^/]+)/i)?.[1];

  if (!state || (!lower && !upper)) return null;

  return {
    state,
    district: lower || upper,
    chamber: lower ? "lower" : "upper"
  };
}

async function fetchJson(url, options, providerName) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${providerName} returned HTTP ${response.status}`);
  }
  return response.json();
}

async function findOfficials(ocdId, openStatesKey) {
  const district = parseStateDistrict(ocdId);
  if (!district) return [];

  const url = new URL("https://v3.openstates.org/people");
  url.searchParams.set("jurisdiction", STATE_NAMES[district.state]);
  url.searchParams.set("org_classification", district.chamber);
  url.searchParams.set("district", district.district.toUpperCase());
  url.searchParams.set("current", "true");

  const data = await fetchJson(
    url,
    { headers: { "X-API-KEY": openStatesKey } },
    "OpenStates"
  );

  return data.results || [];
}

export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { address } = await request.json();
    if (typeof address !== "string" || address.trim().length < 5 || address.length > 300) {
      return Response.json({ error: "Please provide a valid address." }, { status: 400 });
    }

    const googleKey = process.env.GOOGLE_CIVIC_API_KEY;
    const openStatesKey = process.env.OPENSTATES_API_KEY;
    if (!googleKey || !openStatesKey) {
      console.error("Required API environment variables are missing.");
      return Response.json({ error: "The lookup service is not configured." }, { status: 500 });
    }

    const googleUrl = new URL("https://www.googleapis.com/civicinfo/v2/divisionsByAddress");
    googleUrl.searchParams.set("address", address.trim());
    googleUrl.searchParams.set("key", googleKey);
    const civicData = await fetchJson(googleUrl, {}, "Google Civic");

    const divisions = Object.entries(civicData.divisions || {}).filter(([id]) =>
      /\/sld[lu]:/i.test(id)
    );

    const results = [];
    for (const [ocdId, division] of divisions) {
      const officials = await findOfficials(ocdId, openStatesKey);
      for (const official of officials) {
        results.push({
          divisionName: division.name,
          party: official.party || "",
          title: official.current_role?.title || "Legislator",
          name: official.name || "",
          email: official.email || ""
        });
      }
    }

    return Response.json({ results });
  } catch (error) {
    console.error("Lookup failed:", error);
    return Response.json(
      { error: "We couldn't complete the lookup." },
      { status: 502 }
    );
  }
};

