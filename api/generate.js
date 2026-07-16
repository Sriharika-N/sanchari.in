/**
 * AI Travel Planner — Core Generation & Calculation Engine
 * Dedicated module handling geographical routing, regional matrices, and layout algorithms.
 */

const travelKnowledgeBase = {
  "coorg": {
    famous: ["Abbey Falls Scenic Estate Walk", "Namdroling Golden Temple", "Madikeri Historic Fort Grounds", "Raja's Seat Hanging Gardens"],
    gems: ["Chelavara Falls Ridge Trek", "Kote Betta Mountain Trail", "Sanapur Whispering Streams", "Nishani Motte Hidden Offbeat Outpost"],
    breakfast: ["Local filter coffee paired with Akki Roti", "Fresh plantation-side spice tea spreads"],
    eats: ["Coorg Cuisine Restaurant for authentic Pandi Curry", "Tiger Tiger Cafe specialty local plates"]
  },
  "munnar": {
    famous: ["Eravikulam High Plateau Valley", "Mattupetty Lake Boating Gates", "Top Station Horizon Peak", "Tea Museum Heritage Walk"],
    gems: ["Lockhart Gap Panoramic Ridge Way", "Attukad Waterfalls Secluded Glade", "Anamudi Foothill Secret Trails", "Pothamedu Hidden Clouds Viewpoint"],
    breakfast: ["Freshly picked Munnar leaf blends with local idlis", "Highland cardamon tea with appam variants"],
    eats: ["Rapsy Restaurant regional specialty dishes", "Guru's Malabar spice parotta counters"]
  },
  "gokarna": {
    famous: ["Om Beach Rocky Waterfront Trail", "Mahabaleshwar Temple Courtyard", "Kudle Beach Main Surfer Strip", "Half Moon Beach Ridge Overlook"],
    gems: ["Paradise Beach Secluded Jungle Spot", "Belekan Beach Offbeat Bay Trail", "Nirvana Coastal Meadow Path", "God's Own Beach Cliffside Overlook"],
    breakfast: ["Beachside shack continental items & banana buns", "Traditional South Kannada style dosa plates"],
    eats: ["Prema Restaurant legendary local ice cream & meals", "Namaste Cafe absolute oceanfront seafood dinner"]
  },
  "hampi": {
    famous: ["Virupaksha Temple Sacred Courtyard", "Vittala Temple Stone Chariot Monument", "Hemakuta Hill Historic Complex View"],
    gems: ["Sanapur Lake Offbeat Coracle Boat Run", "Anegundi Ancient Heritage Village Walk"],
    breakfast: ["Local crisp ghee roast dosas from rural setups", "Traditional filter decoctions with idlis"],
    eats: ["Mango Tree Restaurant river-facing dishes", "Local organic banana flower curries hub"]
  },
  "spiti valley": {
    famous: ["Key Monastery Mountain Cliffside Retreat", "Chandratal High-Altitude Emerald Lake", "Dhankar Monastery Fort Lookout"],
    gems: ["Langza Mountain Ridge Fossil Beds", "Mud Village Pin Valley Mountain Outpost"],
    breakfast: ["Warm butter tea paired with local Tsampa breads", "Highland barley porridges with honey matrices"],
    eats: ["The Sol Cafe local hot seabuckthorn juices", "Authentic steaming Tibetan momo street shacks"]
  },
  "manali": {
    famous: ["Hidimba Devi Temple Pagoda Shrine", "Solang Valley Adventure Meadows", "Rohtang Pass Himalayan Snow View", "Old Manali Heritage Village"],
    gems: ["Jogni Waterfall Cedar Trek Route", "Naggar Castle Timber Palace Lookout", "Vashisht Natural Sulphur Hot Springs"],
    breakfast: ["Freshly steamed Himachali Siddu platter", "Mall Road masala omelette and spiced chai buns"],
    eats: ["Johnson's Cafe wood-fired valley trout fillets", "The Lazy Dog continental backpacker spreads"]
  },
  "leh ladakh": {
    famous: ["Pangong Tso High-Altitude Saltwater Lake", "Thiksey Monastery Tiered Complex", "Khardung La World Peak Pass"],
    gems: ["Nubra Valley Hunder Sand Dunes Track", "Basgo Castle Ruin Offbeat Paths"],
    breakfast: ["Traditional Ladakhi Khambir skillet bread with butter tea", "Apricot jam reductions with warm cakes"],
    eats: ["Alchi Kitchen heritage traditional recipes diner", "Leh Main Market open-air local dumpling lanes"]
  },
  "goa": {
    famous: ["Fontainhas Historic Latin Quarter Walk", "Dudhsagar Jungle Waterfalls Track", "Aguada Historic Coastal Fort Outpost"],
    gems: ["Cola Beach Hidden Fresh Lagoon Side", "Chorao Island Offbeat Mangrove Boat Paths"],
    breakfast: ["Freshly wood-fired Goan Poi bread with local spreads", "Seaside shack continental fruit salad matrices"],
    eats: ["Mum's Kitchen local authentic Goan fish curry", "Fisherman's Wharf classic coastal seafood dine"]
  },
  "varkala": {
    famous: ["Varkala Cliffside Ocean Overlook Strip", "Janardanaswamy Ancient Coastal Temple"],
    gems: ["Edava Beach Secluded Backwater-Sea Interface", "Kapil Lake Silent Coastal Drive Corridors"],
    breakfast: ["Kerala style layered flaky parotta with egg roast", "Fresh tender coconut shakes on the cliff paths"],
    eats: ["Darjeeling Cafe oceanfront slow-cooked regional dinners", "Local daily-catch fresh grill fish counters"]
  },
  "udaipur": {
    famous: ["City Palace Waterfront Complex", "Lake Pichola Panoramic Shared Boat Routes", "Jagdish Historic Stone Temple Carvings"],
    gems: ["Sajjangarh Monsoon Palace Ridge Lookout", "Badi Lake Offbeat Silent Mountain Edge Path"],
    breakfast: ["Traditional hot Poha topped with regional sev blends", "Freshly fried Kachoris from legacy bazaar lanes"],
    eats: ["Ambrai Restaurant absolute lakeside dining view", "Traditional Mewari royal thali slow-cooked setups"]
  },
  "jaipur": {
    famous: ["Amer Fort Hilltop Palace", "Hawa Mahal Palace of Winds", "City Palace Royal Residence", "Jantar Mantar Historic Observatory"],
    gems: ["Nahargarh Fort Sunset Ridge", "Panna Meena ka Kund Stepwell", "Galta Ji Monkey Temple"],
    breakfast: ["Traditional Pyaz Kachori with sweet lassi", "Legacy market Pandit kulfi blends"],
    eats: ["LMB Restaurant authentic Rajasthani Thali", "Chokhi Dhani ethnic village dining spread"]
  },
  "default": {
    famous: ["Central Heritage Landmark Exploration", "Panoramic Valley Lookout Point", "Ancient Historical Quarter Run", "Main City Botanical Garden"],
    gems: ["Hidden Eco Forest Trail Pathway", "Offbeat River Stream Overlook", "Rustic Artisanal Heritage District Walk", "Secluded Sunset Cliff Outpost"],
    breakfast: ["Traditional prepared local morning spread", "Freshly sorted marketplace food choices"],
    eats: ["Acclaimed local diner choice", "Vibrant food street alleyways"]
  }
};

async function runGeographicalDistanceAndSpeedSuggester() {
  if (typeof syncDynamicCostUIFields === "function") syncDynamicCostUIFields(); 
  const suggestionBox = document.getElementById('distanceSuggestionBox');
  if (!state.destinations.length || !state.transport) {
    suggestionBox.style.display = 'none'; return;
  }

  suggestionBox.style.display = 'block';
  suggestionBox.innerHTML = `⏳ Figuring out the best route choices and calculating map loops...`;

  state.leg1TicketCost = parseInt(document.getElementById('leg1TicketCostInput').value) || 0;
  state.leg1FuelPrice = parseInt(document.getElementById('leg1FuelPrice').value) || 102;
  state.leg1VehicleMileage = parseInt(document.getElementById('leg1VehicleMileage').value) || 15;
  
  state.leg2DailyCost = parseInt(document.getElementById('leg2DailyCostInput').value) || 500;
  state.hasLayover = document.getElementById('layoverToggle').checked;
  
  state.leg3TicketCost = parseInt(document.getElementById('leg3TicketCostInput').value) || 0;
  state.leg3FuelPrice = parseInt(document.getElementById('leg3FuelPrice').value) || 102;
  state.leg3VehicleMileage = parseInt(document.getElementById('leg3VehicleMileage').value) || 15;

  const isDay1PureTravel = document.getElementById('flagDay1TransitCb').checked;
  const isLastDayPureTravel = document.getElementById('flagLastDayTransitCb').checked;
  
  let dynamicPaceAllocationSum = 0;
  if (isDay1PureTravel) dynamicPaceAllocationSum += 1;
  if (isLastDayPureTravel) dynamicPaceAllocationSum += 1;
  state.transitDaysAllocation = dynamicPaceAllocationSum;

  try {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=`;
    const resStart = await fetch(geocodeUrl + encodeURIComponent(state.startCity || 'Bangalore'));
    const dataStart = await resStart.json();
    
    const finalEndpointCity = state.destinations[0] || 'Coorg, Karnataka';
    const resFinal = await fetch(geocodeUrl + encodeURIComponent(finalEndpointCity));
    const dataFinal = await resFinal.json();
    
    let finalCalculatedKM = 310;
    let exactDrivingHours = 6;
    let formattedMinutes = 45;

    if (dataStart.length && dataFinal.length) {
      const startPoint = `${dataStart[0].lon},${dataStart[0].lat}`;
      const finalPoint = `${dataFinal[0].lon},${dataFinal[0].lat}`;
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startPoint};${finalPoint}?overview=false`;
      const osrmRes = await fetch(osrmUrl);
      const osrmData = await osrmRes.json();
      
      if (osrmData.routes && osrmData.routes.length) {
        const networkRoute = osrmData.routes[0];
        finalCalculatedKM = Math.round(networkRoute.distance / 1000);
        exactDrivingHours = Math.round(networkRoute.duration / 3600);
        formattedMinutes = Math.round((networkRoute.duration % 3600) / 60);
      }
    }
    
    let routeSummaryLabel = 'Single Base Hub';
    if (state.routeStyle === 'Multi-City' && state.stopoverCities.length > 0) {
      finalCalculatedKM += (state.stopoverCities.length * 90); 
      exactDrivingHours += (state.stopoverCities.length * 2);
      let stopNamesList = state.stopoverCities.map(c => `${c.cityName} (${c.shiftTime.split(' ')[0]})`);
      routeSummaryLabel = `Stopovers Active [${stopNamesList.join(' ➔ ')}]`;
    }

    state.calculatedDistanceKM = finalCalculatedKM;
    
    let outboundCostPerHead = (state.transport === 'Full Road Trip') ? Math.round((finalCalculatedKM / state.leg1VehicleMileage) * state.leg1FuelPrice / state.groupSize) : state.leg1TicketCost;
    let returnCostPerHead = (state.leg3Transport === 'Drive Return') ? Math.round((finalCalculatedKM / state.leg3VehicleMileage) * state.leg3FuelPrice / state.groupSize) : state.leg3TicketCost;
    let totalLocalCommuteCostPerHead = Math.round((state.leg2DailyCost * (state.days || 1)) / state.groupSize);
    let cumulativeTransitSpend = outboundCostPerHead + returnCostPerHead + totalLocalCommuteCostPerHead;
    
    let localOptionsDisplay = state.leg2Transport.length > 0 ? state.leg2Transport.join(", ") : "None chosen";
    
    suggestionBox.innerHTML = `
      🗺️ <strong>Total Map Distance:</strong> ~${finalCalculatedKM} KM loop route mapping.<br>
      🏎️ <strong>Route Strategy:</strong> ${routeSummaryLabel}<br>
      🎬 <strong>Traveling There:</strong> ${state.transport}<br>
      🗺️ <strong>Exploring Town:</strong> ${localOptionsDisplay}<br>
      🏡 <strong>Heading Back Home:</strong> From ${state.homewardStartCity || finalEndpointCity} via ${state.leg3Transport}<br>
      ⏱️ <strong>Estimated Continuous Travel Time:</strong> ~${exactDrivingHours}h ${formattedMinutes}m ${state.hasLayover ? '(Scenic layover incorporated)' : ''}.<br>
      💵 <strong>Estimated Expenses Metrics (Per Head):</strong> Heading There: ₹${outboundCostPerHead} | Heading Home: ₹${returnCostPerHead} | Exploring Town: ₹${totalLocalCommuteCostPerHead}<br>
      💰 <strong>Total Route Budget Baseline:</strong> <span style="color:var(--coral); font-weight:700;">₹${cumulativeTransitSpend.toLocaleString('en-IN')} INR per traveler</span>.<br>
      💡 <strong>Our Pacing:</strong> Calculated cleanly using your travel day checkboxes below.
    `;
  } catch (apiError) {
    console.warn("API map fallback sequence run.", apiError);
    suggestionBox.innerHTML = `🏁 <strong>Transit Map Configuration Loop resolved safely.</strong>`;
  }
}

async function queryInAppRealtimeDistance(dateKey) {
  const startLoc = document.getElementById(`local-route-start-${dateKey}`).value.trim();
  const endLoc = document.getElementById(`local-route-end-${dateKey}`).value.trim();
  const feedbackNode = document.getElementById(`local-route-result-${dateKey}`);
  
  if(!startLoc || !endLoc) {
    feedbackNode.innerHTML = `<span style="color:red;">⚠️ Please enter both starting and ending spots to calculate.</span>`;
    return;
  }
  feedbackNode.innerHTML = `⏳ Checking OpenStreetMap grids...`;
  
  try {
    const geocodeBase = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=`;
    const resA = await fetch(geocodeBase + encodeURIComponent(startLoc));
    const dataA = await resA.json();
    const resB = await fetch(geocodeBase + encodeURIComponent(endLoc));
    const dataB = await resB.json();
    
    if(dataA.length && dataB.length) {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${dataA[0].lon},${dataA[0].lat};${dataB[0].lon},${dataB[0].lat}?overview=false`;
      const osrmRes = await fetch(osrmUrl);
      const osrmData = await osrmRes.json();
      
      if (osrmData.routes && osrmData.routes.length) {
        const routeData = osrmData.routes[0];
        const distanceKM = (routeData.distance / 1000).toFixed(1);
        const durationMins = Math.round(routeData.duration / 60);
        
        feedbackNode.innerHTML = `
          <div style="background:var(--success-bg); color:var(--success); padding:8px; border-radius:6px; font-size:13px; margin-top:8px; border-left:3px solid var(--success);">
            🏁 <strong>In-App Distance Matrix:</strong> ~${distanceKM} KM | ⏱️ <strong>Drive Duration:</strong> ~${durationMins} mins<br>
            <a href="https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startLoc)}&destination=${encodeURIComponent(endLoc)}&travelmode=driving" target="_blank" style="color:var(--ocean); font-weight:600; text-decoration:underline; font-size:12px; display:inline-block; margin-top:4px;">🗺️ View Complete Map Track</a>
          </div>
        `;
        return;
      }
    }
    throw new Error("Coordinates mismatch.");
  } catch(e) {
    feedbackNode.innerHTML = `<span style="color:var(--muted); font-size:12.5px;">🏁 Fallback: <a href="https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startLoc)}&destination=${encodeURIComponent(endLoc)}" target="_blank" style="text-decoration:underline; font-weight:600; color:var(--coral);">Launch routing loop on Google Maps</a></span>`;
  }
}
