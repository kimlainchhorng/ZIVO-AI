export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  website: string;
}

export const INTEGRATIONS: Integration[] = [
  // Healthcare (15)
  { id: "epic", name: "Epic EHR", category: "healthcare", description: "Industry-leading electronic health records system", website: "https://www.epic.com" },
  { id: "cerner", name: "Cerner", category: "healthcare", description: "Healthcare IT and EHR platform by Oracle", website: "https://www.cerner.com" },
  { id: "allscripts", name: "AllScripts", category: "healthcare", description: "Healthcare IT solutions and EHR platform", website: "https://www.allscripts.com" },
  { id: "athenahealth", name: "Athenahealth", category: "healthcare", description: "Cloud-based clinical and financial workflows", website: "https://www.athenahealth.com" },
  { id: "medidata", name: "Medidata", category: "healthcare", description: "Clinical trial management platform", website: "https://www.medidata.com" },
  { id: "veradigm", name: "Veradigm", category: "healthcare", description: "Healthcare data and insights platform", website: "https://veradigm.com" },
  { id: "drfirst", name: "DrFirst", category: "healthcare", description: "e-Prescribing and medication management", website: "https://www.drfirst.com" },
  { id: "ndc", name: "NDC", category: "healthcare", description: "National Drug Code directory API", website: "https://www.fda.gov/drugs/drug-approvals-and-databases/national-drug-code-directory" },
  { id: "ncbi", name: "NCBI", category: "healthcare", description: "National Center for Biotechnology Information APIs", website: "https://www.ncbi.nlm.nih.gov" },
  { id: "hl7", name: "HL7", category: "healthcare", description: "Health Level 7 interoperability standards", website: "https://www.hl7.org" },
  { id: "fhir", name: "FHIR", category: "healthcare", description: "Fast Healthcare Interoperability Resources API", website: "https://www.hl7.org/fhir" },
  { id: "pubmed", name: "PubMed", category: "healthcare", description: "Biomedical literature database API", website: "https://pubmed.ncbi.nlm.nih.gov" },
  { id: "zocdoc", name: "Zocdoc", category: "healthcare", description: "Doctor appointment booking platform", website: "https://www.zocdoc.com" },
  { id: "healthgrades", name: "Healthgrades", category: "healthcare", description: "Healthcare provider ratings and reviews", website: "https://www.healthgrades.com" },
  { id: "alliant", name: "Alliant", category: "healthcare", description: "Healthcare data and analytics network", website: "https://www.alliant.com" },

  // Real Estate (15)
  { id: "zillow", name: "Zillow", category: "real-estate", description: "Real estate marketplace and Zestimate API", website: "https://www.zillow.com" },
  { id: "trulia", name: "Trulia", category: "real-estate", description: "Home search and neighborhood insights", website: "https://www.trulia.com" },
  { id: "redfin", name: "Redfin", category: "real-estate", description: "Technology-powered real estate brokerage", website: "https://www.redfin.com" },
  { id: "mls", name: "MLS", category: "real-estate", description: "Multiple Listing Service network integration", website: "https://www.nar.realtor/mls" },
  { id: "realogy", name: "Realogy", category: "real-estate", description: "Integrated real estate services platform", website: "https://www.realogy.com" },
  { id: "corelogic", name: "CoreLogic", category: "real-estate", description: "Property data and analytics platform", website: "https://www.corelogic.com" },
  { id: "black-knight", name: "Black Knight", category: "real-estate", description: "Mortgage and real estate data solutions", website: "https://www.blackknightinc.com" },
  { id: "costar", name: "CoStar", category: "real-estate", description: "Commercial real estate information and analytics", website: "https://www.costar.com" },
  { id: "hotpads", name: "HotPads", category: "real-estate", description: "Rental and home search platform", website: "https://hotpads.com" },
  { id: "movoto", name: "Movoto", category: "real-estate", description: "Online real estate marketplace", website: "https://www.movoto.com" },
  { id: "propertyradar", name: "PropertyRadar", category: "real-estate", description: "Property data and owner information API", website: "https://www.propertyradar.com" },
  { id: "loopnet", name: "Loopnet", category: "real-estate", description: "Commercial real estate marketplace", website: "https://www.loopnet.com" },
  { id: "cbre", name: "CBRE", category: "real-estate", description: "Commercial real estate services and data", website: "https://www.cbre.com" },
  { id: "stratum", name: "Stratum", category: "real-estate", description: "Real estate data and research platform", website: "https://stratumdata.com" },
  { id: "stratum-mls", name: "Stratum MLS", category: "real-estate", description: "MLS data exchange and syndication", website: "https://stratumdata.com" },

  // Travel (15)
  { id: "expedia", name: "Expedia", category: "travel", description: "Online travel booking platform and API", website: "https://www.expedia.com" },
  { id: "booking-com", name: "Booking.com", category: "travel", description: "Accommodation booking platform", website: "https://www.booking.com" },
  { id: "kayak", name: "Kayak", category: "travel", description: "Travel search and price comparison", website: "https://www.kayak.com" },
  { id: "skyscanner", name: "Skyscanner", category: "travel", description: "Global flight and hotel search", website: "https://www.skyscanner.com" },
  { id: "google-flights", name: "Google Flights", category: "travel", description: "Flight search with price prediction", website: "https://www.google.com/flights" },
  { id: "amadeus", name: "Amadeus", category: "travel", description: "Global travel technology and GDS platform", website: "https://www.amadeus.com" },
  { id: "sabre", name: "Sabre", category: "travel", description: "Travel technology GDS and APIs", website: "https://www.sabre.com" },
  { id: "travelport", name: "Travelport", category: "travel", description: "Global travel commerce platform", website: "https://www.travelport.com" },
  { id: "viator", name: "Viator", category: "travel", description: "Tours and activities booking platform", website: "https://www.viator.com" },
  { id: "getyourguide", name: "GetYourGuide", category: "travel", description: "Activities and experiences marketplace", website: "https://www.getyourguide.com" },
  { id: "tripadvisor", name: "Tripadvisor", category: "travel", description: "Travel reviews and booking platform", website: "https://www.tripadvisor.com" },
  { id: "airbnb", name: "Airbnb", category: "travel", description: "Short-term rental marketplace", website: "https://www.airbnb.com" },
  { id: "vrbo", name: "Vrbo", category: "travel", description: "Vacation rental marketplace", website: "https://www.vrbo.com" },
  { id: "hotels-com", name: "Hotels.com", category: "travel", description: "Hotel booking and rewards platform", website: "https://www.hotels.com" },
  { id: "agoda", name: "Agoda", category: "travel", description: "Asia-focused travel booking platform", website: "https://www.agoda.com" },

  // Social Media (15)
  { id: "facebook", name: "Facebook", category: "social-media", description: "Social graph, ads, and authentication APIs", website: "https://developers.facebook.com" },
  { id: "twitter", name: "Twitter/X", category: "social-media", description: "Tweet publishing and social graph API", website: "https://developer.twitter.com" },
  { id: "instagram", name: "Instagram", category: "social-media", description: "Photo sharing and Instagram Graph API", website: "https://developers.facebook.com/docs/instagram" },
  { id: "tiktok", name: "TikTok", category: "social-media", description: "Short video platform API", website: "https://developers.tiktok.com" },
  { id: "linkedin", name: "LinkedIn", category: "social-media", description: "Professional network and job posting API", website: "https://www.linkedin.com/developers" },
  { id: "snapchat", name: "Snapchat", category: "social-media", description: "Ephemeral media and AR lens API", website: "https://developers.snap.com" },
  { id: "discord", name: "Discord", category: "social-media", description: "Community and messaging bot API", website: "https://discord.com/developers" },
  { id: "telegram", name: "Telegram", category: "social-media", description: "Messaging bot and channel API", website: "https://core.telegram.org" },
  { id: "mastodon", name: "Mastodon", category: "social-media", description: "Federated social network API", website: "https://mastodon.social" },
  { id: "bluesky", name: "Bluesky", category: "social-media", description: "Decentralized social protocol (AT Protocol)", website: "https://atproto.com" },
  { id: "threads", name: "Threads", category: "social-media", description: "Meta's text-based social platform API", website: "https://developers.facebook.com/docs/threads" },
  { id: "bereal", name: "BeReal", category: "social-media", description: "Authentic photo sharing platform", website: "https://bere.al" },
  { id: "wechat", name: "WeChat", category: "social-media", description: "Chinese super-app messaging and payment API", website: "https://developers.weixin.qq.com" },
  { id: "whatsapp", name: "WhatsApp", category: "social-media", description: "Business messaging and notification API", website: "https://developers.facebook.com/docs/whatsapp" },
  { id: "signal", name: "Signal", category: "social-media", description: "Privacy-first encrypted messaging protocol", website: "https://signal.org" },

  // Video Platforms (15)
  { id: "youtube", name: "YouTube", category: "video-platforms", description: "Video upload, streaming, and analytics API", website: "https://developers.google.com/youtube" },
  { id: "vimeo", name: "Vimeo", category: "video-platforms", description: "Professional video hosting platform", website: "https://developer.vimeo.com" },
  { id: "wistia", name: "Wistia", category: "video-platforms", description: "Business video hosting and analytics", website: "https://wistia.com/support/developers" },
  { id: "brightcove", name: "Brightcove", category: "video-platforms", description: "Cloud video platform and player SDK", website: "https://www.brightcove.com" },
  { id: "jwplayer", name: "JW Player", category: "video-platforms", description: "Video player and streaming platform", website: "https://www.jwplayer.com" },
  { id: "kaltura", name: "Kaltura", category: "video-platforms", description: "Open-source video platform", website: "https://developer.kaltura.com" },
  { id: "dailymotion", name: "Dailymotion", category: "video-platforms", description: "Video hosting and distribution platform", website: "https://developers.dailymotion.com" },
  { id: "twitch", name: "Twitch", category: "video-platforms", description: "Live streaming and gaming platform API", website: "https://dev.twitch.tv" },
  { id: "rtmp", name: "RTMP", category: "video-platforms", description: "Real-Time Messaging Protocol for live streams", website: "https://www.adobe.com/devnet/rtmp.html" },
  { id: "hls", name: "HLS", category: "video-platforms", description: "HTTP Live Streaming protocol", website: "https://developer.apple.com/streaming" },
  { id: "dash", name: "DASH", category: "video-platforms", description: "Dynamic Adaptive Streaming over HTTP", website: "https://dashif.org" },
  { id: "aws-medialive", name: "AWS MediaLive", category: "video-platforms", description: "Cloud-based live video encoding service", website: "https://aws.amazon.com/medialive" },
  { id: "azure-media", name: "Azure Media Services", category: "video-platforms", description: "Cloud video processing and streaming", website: "https://azure.microsoft.com/en-us/products/media-services" },
  { id: "mux", name: "Mux", category: "video-platforms", description: "API-first video infrastructure platform", website: "https://www.mux.com" },
  { id: "bunny", name: "Bunny.net", category: "video-platforms", description: "Global CDN and video streaming platform", website: "https://bunny.net" },

  // Music Streaming (15)
  { id: "spotify", name: "Spotify", category: "music-streaming", description: "Music streaming and catalog data API", website: "https://developer.spotify.com" },
  { id: "apple-music", name: "Apple Music", category: "music-streaming", description: "Music streaming and MusicKit API", website: "https://developer.apple.com/musickit" },
  { id: "amazon-music", name: "Amazon Music", category: "music-streaming", description: "Amazon's music streaming service API", website: "https://developer.amazon.com/music" },
  { id: "youtube-music", name: "YouTube Music", category: "music-streaming", description: "Music-focused YouTube platform", website: "https://music.youtube.com" },
  { id: "tidal", name: "Tidal", category: "music-streaming", description: "High-fidelity music streaming platform", website: "https://tidal.com" },
  { id: "deezer", name: "Deezer", category: "music-streaming", description: "Music streaming platform and API", website: "https://developers.deezer.com" },
  { id: "soundcloud", name: "SoundCloud", category: "music-streaming", description: "Audio distribution and discovery platform", website: "https://developers.soundcloud.com" },
  { id: "bandcamp", name: "Bandcamp", category: "music-streaming", description: "Artist-first music marketplace", website: "https://bandcamp.com/developer" },
  { id: "mixcloud", name: "Mixcloud", category: "music-streaming", description: "DJ mixes and radio shows platform", website: "https://www.mixcloud.com/developers" },
  { id: "lastfm", name: "Last.fm", category: "music-streaming", description: "Music scrobbling and recommendation API", website: "https://www.last.fm/api" },
  { id: "genius", name: "Genius", category: "music-streaming", description: "Song lyrics and annotations API", website: "https://docs.genius.com" },
  { id: "musixmatch", name: "MusixMatch", category: "music-streaming", description: "World's largest lyrics database API", website: "https://developer.musixmatch.com" },
  { id: "songkick", name: "Songkick", category: "music-streaming", description: "Concert and tour data API", website: "https://www.songkick.com/developer" },
  { id: "bandsintown", name: "Bandsintown", category: "music-streaming", description: "Artist event and concert tracking API", website: "https://app.swaggerhub.com/apis/Bandsintown" },
  { id: "ticketmaster", name: "Ticketmaster", category: "music-streaming", description: "Event ticketing and discovery API", website: "https://developer.ticketmaster.com" },

  // Job Boards (15)
  { id: "linkedin-jobs", name: "LinkedIn Jobs", category: "job-boards", description: "Professional job network posting API", website: "https://www.linkedin.com/developers" },
  { id: "indeed", name: "Indeed", category: "job-boards", description: "World's largest job site API", website: "https://www.indeed.com/publisher" },
  { id: "glassdoor", name: "Glassdoor", category: "job-boards", description: "Company reviews and salary data API", website: "https://www.glassdoor.com/developer" },
  { id: "monster", name: "Monster", category: "job-boards", description: "Job board and resume database", website: "https://www.monster.com" },
  { id: "careerbuilder", name: "CareerBuilder", category: "job-boards", description: "Job posting and candidate matching API", website: "https://www.careerbuilder.com" },
  { id: "ziprecruiter", name: "ZipRecruiter", category: "job-boards", description: "AI-powered job matching platform", website: "https://www.ziprecruiter.com/partner" },
  { id: "dice", name: "Dice", category: "job-boards", description: "Tech-focused job board platform", website: "https://www.dice.com" },
  { id: "stackoverflow-jobs", name: "Stack Overflow", category: "job-boards", description: "Developer-focused job listings", website: "https://stackoverflow.com/jobs" },
  { id: "github-jobs", name: "GitHub", category: "job-boards", description: "Developer profile and portfolio integration", website: "https://github.com" },
  { id: "angellist", name: "AngelList", category: "job-boards", description: "Startup job listings and investor platform", website: "https://angel.co" },
  { id: "upwork", name: "Upwork", category: "job-boards", description: "Freelance talent marketplace API", website: "https://developers.upwork.com" },
  { id: "fiverr", name: "Fiverr", category: "job-boards", description: "Freelance services marketplace", website: "https://developers.fiverr.com" },
  { id: "remoteok", name: "RemoteOK", category: "job-boards", description: "Remote job board and API", website: "https://remoteok.com" },
  { id: "flexjobs", name: "FlexJobs", category: "job-boards", description: "Flexible and remote job listings", website: "https://www.flexjobs.com" },
  { id: "weworkremotely", name: "We Work Remotely", category: "job-boards", description: "Remote job board for digital workers", website: "https://weworkremotely.com" },

  // E-Commerce (15)
  { id: "shopify", name: "Shopify", category: "e-commerce", description: "E-commerce platform and Storefront API", website: "https://shopify.dev" },
  { id: "woocommerce", name: "WooCommerce", category: "e-commerce", description: "WordPress e-commerce plugin REST API", website: "https://woocommerce.com/document/woocommerce-rest-api" },
  { id: "magento", name: "Magento", category: "e-commerce", description: "Adobe Commerce platform API", website: "https://developer.adobe.com/commerce" },
  { id: "bigcommerce", name: "BigCommerce", category: "e-commerce", description: "SaaS e-commerce platform API", website: "https://developer.bigcommerce.com" },
  { id: "etsy", name: "Etsy", category: "e-commerce", description: "Handmade and vintage marketplace API", website: "https://developers.etsy.com" },
  { id: "amazon", name: "Amazon", category: "e-commerce", description: "Marketplace and fulfillment APIs (SP-API)", website: "https://developer-docs.amazon.com" },
  { id: "ebay", name: "eBay", category: "e-commerce", description: "Auction and fixed-price marketplace API", website: "https://developer.ebay.com" },
  { id: "printful", name: "Printful", category: "e-commerce", description: "Print-on-demand fulfillment API", website: "https://developers.printful.com" },
  { id: "oberlo", name: "Oberlo", category: "e-commerce", description: "Dropshipping product sourcing platform", website: "https://www.oberlo.com" },
  { id: "aliexpress", name: "AliExpress", category: "e-commerce", description: "Global wholesale marketplace API", website: "https://developers.aliexpress.com" },
  { id: "temu", name: "Temu", category: "e-commerce", description: "Global discount marketplace", website: "https://www.temu.com" },
  { id: "wix", name: "Wix", category: "e-commerce", description: "Website builder and e-commerce platform", website: "https://dev.wix.com" },
  { id: "squarespace", name: "Squarespace", category: "e-commerce", description: "Design-focused website and store builder", website: "https://developers.squarespace.com" },
  { id: "shein", name: "SHEIN", category: "e-commerce", description: "Fast fashion marketplace platform", website: "https://www.shein.com" },
  { id: "stripe-ecom", name: "Stripe Commerce", category: "e-commerce", description: "Payment processing and checkout API", website: "https://stripe.com/docs" },

  // SaaS Tools (10)
  { id: "zapier", name: "Zapier", category: "saas-tools", description: "No-code automation and app integration", website: "https://zapier.com/developer" },
  { id: "make", name: "Make", category: "saas-tools", description: "Visual workflow automation platform", website: "https://www.make.com/en/api-documentation" },
  { id: "n8n", name: "n8n", category: "saas-tools", description: "Open-source workflow automation tool", website: "https://n8n.io" },
  { id: "ifttt", name: "IFTTT", category: "saas-tools", description: "If-this-then-that automation platform", website: "https://ifttt.com/developer" },
  { id: "aws-eventbridge", name: "AWS EventBridge", category: "saas-tools", description: "Serverless event bus for AWS services", website: "https://aws.amazon.com/eventbridge" },
  { id: "google-workflows", name: "Google Workflows", category: "saas-tools", description: "Serverless workflow orchestration on GCP", website: "https://cloud.google.com/workflows" },
  { id: "azure-logic-apps", name: "Azure Logic Apps", category: "saas-tools", description: "Cloud-based workflow automation service", website: "https://azure.microsoft.com/en-us/products/logic-apps" },
  { id: "workato", name: "Workato", category: "saas-tools", description: "Enterprise integration and automation platform", website: "https://www.workato.com/developer" },
  { id: "piesync", name: "PieSync", category: "saas-tools", description: "Two-way contact sync platform (acquired by HubSpot; functionality available via HubSpot Operations Hub)", website: "https://www.piesync.com" },
  { id: "integromat", name: "Integromat", category: "saas-tools", description: "Advanced automation platform (rebranded as Make in 2022; same product available at make.com)", website: "https://www.integromat.com" },
];

export function getIntegrationsByCategory(category: string): Integration[] {
  return INTEGRATIONS.filter((i) => i.category === category);
}

export function getIntegrationById(id: string): Integration | undefined {
  return INTEGRATIONS.find((i) => i.id === id);
}

export const INTEGRATION_CATEGORIES = [
  { id: "healthcare", name: "Healthcare", count: 15 },
  { id: "real-estate", name: "Real Estate", count: 15 },
  { id: "travel", name: "Travel", count: 15 },
  { id: "social-media", name: "Social Media", count: 15 },
  { id: "video-platforms", name: "Video Platforms", count: 15 },
  { id: "music-streaming", name: "Music Streaming", count: 15 },
  { id: "job-boards", name: "Job Boards", count: 15 },
  { id: "e-commerce", name: "E-Commerce", count: 15 },
  { id: "saas-tools", name: "SaaS Tools", count: 10 },
];
