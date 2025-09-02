async function civicDivisionsByAddress(address) {
    const url = new URL("https://www.googleapis.com/civicinfo/v2/divisionsByAddress");
    // TODO: possible command injection?
    url.searchParams.set("address", address);
    const key = await getKeyByName("GOOGLE_CIVIC_API_KEY");
    url.searchParams.set("key", key);

    const r = await fetch(url.toString(), { method: "GET" });
    if (!r.ok) throw new Error(`Civic error ${r.status}`);
    const data = await r.json();
    return data["divisions"];
}

function parseOcdDivision(ocdDivisionId) {
    if (!ocdDivisionId.startsWith("ocd-division/")) {
        throw new Error(`Not a valid OCD division id: '${ocdDivisionId}'`);
    }

    // Remove the leading "ocd-division/"
    const parts = ocdDivisionId.replace(/^ocd-division\//, "").split("/");

    const result = {};

    for (const part of parts) {
        const [key, value] = part.split(":");

        if (key === "sldl") {
            result.district = value;
            result.org_classification = "lower";
        } else if (key === "sldu") {
            result.district = value;
            result.org_classification = "upper";
        } else {
            result[key] = value;
        }
    }

    return result;
}

function filterDivisionsByLevel(all_divisions, level) {
    if (level == "federal") {
        return getFederalDivisions(all_divisions);
    } else if (level == "state") {
        return getStateDivisions(all_divisions);
    } else if (level == "local") {
        return getLocalDivision(all_divisions);
    } else if (level == "all") {
        let out = getFederalDivisions(all_divisions);
        out.push(getStateDivisions(all_divisions));
        out.push(getLocalDivisions(all_divisions));
        return out;
    } else {
        throw new Error(`Unexpected value for 'level': ${level}`);
    }
}

function getFederalDivisions(all_divisions) {
    let patterns = [/country:us$/, /cd:\d+/];
    console.log("Federal not supported yet");
    return [];
}

function getStateDivisions(all_divisions) {
    const patterns = [/sldl:/, /sldu:/];
    const out = {};

    for (const [id, info] of Object.entries(all_divisions)) {
        if (patterns.some(re => re.test(id))) {
            const state = getStateCodeFromOcdId(id);
            if (state == "id") {
                // Each idaho house district has 'a' and 'b' which is not output by google api
                let hosue_a = info["alsoKnownAs"] + 'a';
                let house_b = info["alsoKnownAs"] + 'b';
                out[hosue_a] = info;
                out[house_b] = info;
            } else {
                // if there is a shared district, add the lower district
                if ("alsoKnownAs" in info) {
                    out[info["alsoKnownAs"]] = info
                }   
            }
            // always push the ocdid as is
            out[id] = info;
        }
    }
    return out;
}

function getLocalDivision(all_divisions) {
    let patterns = [/county:/, /place:/, /council_district:/, /school_district:/, /township/];
    console.log("Local not supported yet");
    return [];
}


async function legislatorsFromOCD(ocdDivisionId) {
    const div = parseOcdDivision(ocdDivisionId)
    // prepare query
    const url = new URL("https://v3.openstates.org/people");
    url.searchParams.set("jurisdiction", await getStateNameFromCode(div["state"]));
    url.searchParams.set("org_classification", div["org_classification"]);
    url.searchParams.set("district", div["district"].toUpperCase());
    url.searchParams.set("current", "true");

    try {
        // make request
        const key = await getKeyByName("OPENSTATES_API_KEY");
        const response = await fetch(url, { headers: { "X-API-KEY": key } });
        if (!response.ok) {
          console.log(`HTTP ${response.status} for ${url}`);
          return []; 
        }
        // get results
        const raw_out = await response.json()
        if (raw_out["results"].length == 0) {
            console.log(`Error: no results for ocd: ${ocdDivisionId} url: ${url}`)
            return [];
        }
        // build output 
        let reps = []
        for (const rep of raw_out["results"]) {
            const info = `${rep["party"]} ${rep["current_role"]["title"]} ${rep["name"]}: ${rep["email"]}`
            reps.push(info)
        }
        return reps;
    } catch (err) {
        console.log(`Error ${err}: open states api for division: ${ocdDivisionId}`)
        return [];
    }
}

async function getOutput(address, level, display) {
    const all_divisions = await civicDivisionsByAddress(address);
    const divisions = filterDivisionsByLevel(all_divisions, level);
    for (const ocdId of Object.keys(divisions)) {
        const divName = divisions[ocdId].name;
        let reps = await legislatorsFromOCD(ocdId);
        for (const rep_info of reps) {
            // Make a line of text
            const line = document.createElement("div");
            line.textContent = `${divName}: ${rep_info}`;
            display.appendChild(line);
        }
    }
}

document.getElementById("lookup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const display = document.getElementById("results");
    const addr = document.getElementById("address").value.trim();
    const level = document.getElementById("level").value.trim();
    display.textContent = "";
    try {
        getOutput(addr, level, display);
    }
    catch (err) {
        results.textContent = String(err);
    }
});

/// Helper Functions ////////////////////////////////////////////////

// TODO support puerto rico and dc

async function getStateNameFromCode(code) {
    const res = await fetch("state_codes.json");
    if (!res.ok) throw new Error(`Failed to load state_codes.json: ${res.status}`);
    const code_to_state = await res.json();
    return code_to_state[code];
}

async function getKeyByName(key_name) {
    const res = await fetch("env.json");
    if (!res.ok) throw new Error(`Failed to load env.json: ${res.status}`);
    const api_keys = await res.json();
    return api_keys[key_name];
}

function getStateCodeFromOcdId(ocdid) {
    // matches the first two letters after "state:" and a word boundary 
    // 'i' indicates case insensitive
    const match = ocdid.match(/state:([a-z]{2})\b/i);
    return match ? match[1].toLowerCase() : null;
}

/// Testing Code ////////////////////////////////////////////////////

document.getElementById("run-tests").addEventListener("click", async (e) => {
    e.preventDefault();
    test_getStateCodeFromOcdId();
    // this test is slow
    await test_getOutput();
    
});

async function test_getOutput() {
    const states = await getStates();
    const display = document.getElementById("test-results");
    skipped = 0;
    passed = 0;
    failed = 0;
    for (const s of states) {
        display.textContent = "";
        // skip if no reps or senator
        if (s.total_reps == null) {
            skipped += 1;
            continue;
        }
        await getOutput(s.address, "state", display)
        await sleep(13000); // 13 second to avoid rate limiting
        const divs = Array.from(display.querySelectorAll("div"));
        // check total num reps
        if (divs.length != s.total_reps) {
            console.log(`failed ${s.state} on total reps, got: ${divs.length} expected: ${s.total_reps}`);
            console.log(display);
            failed += 1;
            continue;
        }

        // check lower district number
        const lines = divs.map(el => el.textContent.trim())
        if (!lines.some(line => line.includes(`district ${s.lower}`))) {
            console.log(`failed ${s.state} on lower district, expected ${s.lower}`);
            console.log(display);
            failed += 1;
            continue;
        }

        // check upper district number
        if (!lines.some(line => line.includes(`district ${s.upper}`))) {
            console.log(`failed ${s.state} on upper district, expected ${s.upper}`);
            console.log(display);
            failed += 1;
            continue;
        }
        passed += 1;
        console.log(`${s.state}: passed`)
    }
    display.textContent = "";
    display.textContent = `pass: ${passed} fail: ${failed} skip: ${skipped}`;
}

function test_getStateCodeFromOcdId() {
    console.assert(getStateCodeFromOcdId("ocd-division/country:us/state:id/cd:2") == "id");
    console.assert(getStateCodeFromOcdId("ocd-division/country:us/state:il/sldu:41") == "il");
    console.assert(getStateCodeFromOcdId("ocd-division/country:us/cd:5") == null); 
}

/// Test Helper Functions ///////////////////////////////////////////////////

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getStates() {
    const res = await fetch("states.json");
    if (!res.ok) throw new Error(`Failed to load states.json: ${res.status}`);
    return await res.json();
}