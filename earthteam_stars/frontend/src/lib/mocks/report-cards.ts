import type { ReportCard, ReportCardListItem } from "@/lib/types";
import {
  mockReporter,
  mockReporterFreeland,
  mockReporterNPR,
  mockReporterEntropika,
} from "./users";

// Every entry below is sourced from real EarthTeam / EndPandemics / Freeland projects.
// See plan for full source URLs.

export const mockReportCards: ReportCardListItem[] = [
  // ──────────────────────────────────────────────────────────────
  // COPPER-LEVEL (participation)
  // ──────────────────────────────────────────────────────────────
  {
    id: 1,
    reporter: mockReporterFreeland,
    type: "action",
    title: "CTOC Module 3 – Open Source Intelligence (OSINT) Training",
    description:
      "Completed Module 3 of the Counter Transnational Organized Crime (CTOC) training series, focusing on Open Source Intelligence (OSINT). The CTOC program was designed by Freeland for law enforcement agencies to improve cross-agency and cross-border collaboration to combat transnational organized crime.",
    category: "wildlife_protection",
    activity_date: "2026-03-18",
    location: "Online (Freeland / USAID)",
    tags: ["Education"],
    status: "submitted",
    created_at: "2026-03-18T10:00:00Z",
    updated_at: "2026-03-18T10:00:00Z",
  },
  {
    id: 2,
    reporter: mockReporter,
    type: "action",
    title: "EarthTeam Town Hall – Follow the Money: Tackling Financial Flows of Illegal Wildlife Trade",
    description:
      "Attended the EarthTeam monthly virtual town hall meeting featuring Chinali Patel on tackling financial flows of illegal wildlife trade. EarthTeam runs monthly town halls to foster communication and collaboration across its global alliance.",
    category: "wildlife_protection",
    activity_date: "2026-03-04",
    location: "Virtual (EarthTeam Town Hall)",
    tags: ["Community Engagement", "Education"],
    status: "approved",
    star_level: "copper",
    stars_awarded: 2,
    created_at: "2026-03-04T18:00:00Z",
    updated_at: "2026-03-06T09:00:00Z",
  },
  {
    id: 3,
    reporter: mockReporterFreeland,
    type: "action",
    title: "WildScan App – Trafficked Wildlife Report at Local Market",
    description:
      "Used the WildScan smartphone app to identify and report a suspected trafficked species at a local market. WildScan was originally designed for frontline law enforcement officers and transport sector workers to correctly identify, report and handle commonly trafficked species. The app also encourages civil society to report wildlife in local markets.",
    category: "wildlife_protection",
    activity_date: "2026-03-22",
    location: "Bangkok, Thailand",
    tags: ["Monitoring", "Anti-Poaching"],
    status: "under_review",
    created_at: "2026-03-22T14:00:00Z",
    updated_at: "2026-03-24T08:00:00Z",
  },
  {
    id: 4,
    reporter: mockReporterEntropika,
    type: "action",
    title: "Organic Mushroom Cultivation Workshop – Alternative Livelihood Training",
    description:
      "Attended organic mushroom cultivation training to provide a viable source of alternative livelihood to local communities, so that they are not tempted to enter protected areas to poach wildlife. Training based on the EarthTeam Organic Mushroom Cultivation Manual.",
    category: "regenerative_agriculture",
    activity_date: "2026-02-15",
    location: "Leticia, Colombian Amazon",
    tags: ["Sustainable Farming", "Community Engagement", "Education"],
    status: "issued",
    star_level: "copper",
    stars_awarded: 3,
    created_at: "2026-02-16T08:00:00Z",
    updated_at: "2026-02-28T12:00:00Z",
  },

  // ──────────────────────────────────────────────────────────────
  // SILVER-LEVEL (action)
  // ──────────────────────────────────────────────────────────────
  {
    id: 5,
    reporter: mockReporterNPR,
    type: "action",
    title: "Female Community Ranger Patrol – 5-Day Anti-Poaching Operation",
    description:
      "Led a 5-day patrol as part of the Female Community Ranger Program by National Park Rescue. By recruiting and training female rangers from local communities, the program aims to reduce wildlife poaching and trafficking, and alleviate poverty. Women invest more than 50% of their salary back into their families, are more effective at de-escalation, and at intelligence gathering.",
    category: "wildlife_protection",
    activity_date: "2026-03-10",
    location: "National Park, East Africa",
    problem_statement:
      "Other nearby protected areas have seen an escalation of poaching during lockdown periods. Female ranger recruitment addresses both poverty and enforcement gaps.",
    tags: ["Anti-Poaching", "Community Engagement", "Monitoring"],
    results:
      "Covered 60km of park boundary over 5 days. Removed 8 snares and documented 4 fresh poaching tracks. Engaged 3 local villages in community intelligence sharing.",
    status: "submitted",
    star_level: "silver",
    created_at: "2026-03-12T14:30:00Z",
    updated_at: "2026-03-12T14:30:00Z",
  },
  {
    id: 6,
    reporter: mockReporterFreeland,
    type: "action",
    title: "iTHINK Behavior Change Workshop – Reducing Consumer Demand for Wildlife",
    description:
      "Organized and facilitated a 2-day workshop using the iTHINK Behavior Change Toolkit. Changing the behavior of existing and potential consumers of wildlife is key to reducing long-term pressure on endangered species. The iTHINK toolkit is a comprehensive suite of materials that can be tailor-made for any situation.",
    category: "wildlife_protection",
    activity_date: "2026-02-20",
    location: "Ho Chi Minh City, Vietnam",
    problem_statement:
      "Consumer demand drives illegal wildlife trade. Southeast Asia lies at the heart of the trade as both supplier and consumer.",
    tags: ["Education", "Community Engagement"],
    results:
      "Trained 45 community leaders and local business owners on responsible consumerism messaging. Distributed iTHINK materials in Vietnamese for continued outreach.",
    status: "approved",
    star_level: "silver",
    stars_awarded: 8,
    created_at: "2026-02-22T09:00:00Z",
    updated_at: "2026-03-01T16:00:00Z",
  },
  {
    id: 7,
    reporter: mockReporter,
    type: "action",
    title: "Wildlife Friendly Skies – Airport Staff Training on Wildlife Trafficking",
    description:
      "Delivered training to airport ground staff using the Wildlife Friendly Skies Toolkit, designed to help educate members of the aviation industry about wildlife trafficking, how it exploits the aviation sector and how aviation staff can help identify and intercept trafficked wildlife.",
    category: "wildlife_protection",
    activity_date: "2026-03-05",
    location: "Suvarnabhumi Airport, Bangkok, Thailand",
    tags: ["Education", "Anti-Poaching"],
    results:
      "Trained 32 ground handling staff and 8 customs officers. Distributed species identification cards in Thai and English.",
    status: "under_review",
    star_level: "silver",
    created_at: "2026-03-06T11:00:00Z",
    updated_at: "2026-03-08T10:00:00Z",
  },
  {
    id: 8,
    reporter: mockReporterNPR,
    type: "action",
    title: "PROTECT Ranger Training – Level 3 Field Deployment",
    description:
      "Completed Level 3 of the PROTECT comprehensive training package for defenders of protected areas. PROTECT encompasses 7 levels of training courses, each aimed at a specific role within the habitat protection system. The manuals are based on the ASEAN Center for Biodiversity's competency standards.",
    category: "habitat_protection",
    activity_date: "2026-01-28",
    location: "Khao Sok National Park, Thailand",
    problem_statement:
      "Protected area staff need standardized, competency-based training that can be tailored to local contexts across Southeast Asia.",
    tags: ["Education", "Anti-Poaching", "Monitoring"],
    results:
      "Completed 10-day field deployment module covering patrol planning, evidence collection, GPS mapping, and wildlife crime scene management. Certified 12 rangers.",
    status: "approved",
    star_level: "silver",
    stars_awarded: 10,
    created_at: "2026-01-30T08:00:00Z",
    updated_at: "2026-02-10T12:00:00Z",
  },

  // ──────────────────────────────────────────────────────────────
  // GOLD-LEVEL (verified impact)
  // ──────────────────────────────────────────────────────────────
  {
    id: 9,
    reporter: mockReporterEntropika,
    type: "impact",
    title: "Entropika Rural Community Outreach – Alternative Livelihood Tourism Program",
    description:
      "Quarterly impact report for Entropika's rural community outreach program. Entropika develops community-level economic opportunities to deter reliance on wildlife trafficking. Indigenous communities at the Colombian-Peruvian border are neglected by central governments who do not invest in the economic development of this region, leaving them with few options besides the unsustainable extraction of local resources, including wildlife, to meet basic needs.",
    category: "wildlife_protection",
    activity_date: "2026-03-15",
    location: "Peruvian-Colombian Amazon border region",
    problem_statement:
      "Indigenous communities at the Colombian-Peruvian border have few options besides unsustainable extraction of local resources, including wildlife, to meet basic needs.",
    tags: ["Community Engagement", "Sustainable Farming"],
    results:
      "Two Peruvian communities previously involved in illegal wildlife trade now have registered tourism associations which democratically allocate revenue from low-impact nature tourism.",
    outcomes:
      "Tourism associations provide income to 60 people, improving family earnings and natural resources management. Joint tour packages with nearby nature reserve bring in tourists consistently.",
    metrics_value: 60,
    metrics_unit: "people earning income from ecotourism",
    baseline_description:
      "Communities previously dependent on illegal wildlife trade with no formal tourism or alternative livelihood programs.",
    status: "approved",
    star_level: "gold",
    stars_awarded: 15,
    created_at: "2026-03-16T07:00:00Z",
    updated_at: "2026-03-25T14:00:00Z",
  },
  {
    id: 10,
    reporter: mockReporter,
    type: "impact",
    title: "Rebooting Tropical Agriculture – Community Restoration of Degraded Lands",
    description:
      "Impact report on implementation and scaling of community restoration of degraded lands, part of the Rebooting Tropical/Subtropical Agriculture initiative documented in the EndPandemics Roadmap. The approach establishes high biodiversity buffer zones around wilderness areas that meet human needs through agroforestry and silvo-pasture.",
    category: "regenerative_agriculture",
    activity_date: "2026-02-28",
    location: "Nakuru County, Kenya",
    problem_statement:
      "Degraded agricultural land at the edge of wilderness areas leads to encroachment, habitat loss, and increased human-wildlife conflict.",
    tags: ["Sustainable Farming", "Habitat Restoration", "Community Engagement"],
    results:
      "Converted 12 hectares of degraded farmland to agroforestry system. Trained 30 smallholder farmers in regenerative techniques including cover cropping and composting.",
    outcomes:
      "Crop yields increased 35% in converted plots. Buffer zone reduced wildlife incursions by 60% compared to previous year. Soil organic carbon increased measurably in test plots.",
    metrics_value: 12,
    metrics_unit: "hectares converted to agroforestry",
    baseline_description:
      "Monoculture maize farming with declining yields, no tree cover, frequent wildlife crop-raiding incidents.",
    status: "issued",
    star_level: "gold",
    stars_awarded: 18,
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-20T15:00:00Z",
  },
  {
    id: 11,
    reporter: mockReporterFreeland,
    type: "impact",
    title: "Pangolin Protection – Species Population Survey and Recovery Tracking",
    description:
      "Population survey and recovery tracking for pangolins, one of the most trafficked mammals in the world despite a ban on international trade by CITES. Traffickers have increasingly started to source scales from African pangolins to cater to Asian demand. This survey uses the USAID Pangolin Species Identification materials to assist law enforcement officers in identifying pangolins in trade.",
    category: "wildlife_protection",
    activity_date: "2026-03-20",
    location: "Dong Phayayen-Khao Yai Forest Complex, Thailand",
    problem_statement:
      "Despite a CITES ban on international trade, pangolins are still one of the most trafficked mammals in the world. Comprehensive response requires local enforcement, stakeholder involvement, and consumer demand reduction.",
    tags: ["Monitoring", "Species Recovery", "Anti-Poaching"],
    results:
      "Surveyed 8 transects across 40km. Identified 23 active pangolin burrows, up from 14 in baseline survey. Trained 6 local rangers in pangolin species identification using USAID guide.",
    outcomes:
      "Pangolin burrow density increased 64% over 12-month period in protected transects. Zero trafficking incidents recorded in survey area during reporting period.",
    metrics_value: 23,
    metrics_unit: "active pangolin burrows identified",
    baseline_description:
      "Baseline survey 12 months prior found only 14 active burrows across same transects, with 3 trafficking incidents in preceding quarter.",
    status: "under_review",
    star_level: "gold",
    created_at: "2026-03-21T13:00:00Z",
    updated_at: "2026-03-25T09:00:00Z",
  },
  {
    id: 12,
    reporter: mockReporterNPR,
    type: "impact",
    title: "Wildlife Enforcement Network (WEN) – Provincial Task Force Establishment",
    description:
      "Established a provincial Wildlife Enforcement Network using the WEN building toolkit. The toolkit is a practical and hands-on guide to creating a provincial, national or regional network or task force to curb wildlife crime. It assists users to create a modular, simple, needs-based and effective structure, made up of law enforcement agencies and civil society partners.",
    category: "wildlife_protection",
    activity_date: "2026-01-15",
    location: "Chiang Rai Province, Thailand",
    problem_statement:
      "Wildlife crime requires coordinated multi-agency response. Individual agencies operating in silos cannot effectively dismantle trafficking networks.",
    tags: ["Anti-Poaching", "Community Engagement", "Education"],
    results:
      "Established task force with 4 law enforcement agencies and 3 civil society partners. Conducted joint operations resulting in 2 seizures in first quarter.",
    outcomes:
      "Network produced 2 successful wildlife seizures in first 3 months. Cross-agency intelligence sharing reduced response time from 72 hours to 12 hours. Established linked database on wildlife crimes across participating agencies.",
    metrics_value: 2,
    metrics_unit: "wildlife seizures in first quarter",
    baseline_description:
      "No coordinated wildlife enforcement structure existed at provincial level. Agencies operated independently with no shared intelligence database.",
    status: "draft",
    created_at: "2026-01-20T09:00:00Z",
    updated_at: "2026-01-20T09:00:00Z",
  },
];

export const mockReportCardDetail: ReportCard = {
  ...mockReportCards[4],
  evidence: [
    {
      id: 1,
      report_card_id: 5,
      file_url: "/mock/ranger-patrol-route.pdf",
      file_name: "ranger-patrol-route.pdf",
      file_type: "application/pdf",
      description: "GPS track log of 5-day patrol route covering 60km",
      uploaded_at: "2026-03-12T14:30:00Z",
    },
    {
      id: 2,
      report_card_id: 5,
      file_url: "/mock/snare-removal-photo.jpg",
      file_name: "snare-removal-photo.jpg",
      file_type: "image/jpeg",
      description: "Snares removed from eastern boundary fence line",
      uploaded_at: "2026-03-12T14:31:00Z",
    },
    {
      id: 3,
      report_card_id: 5,
      file_url: "/mock/community-meeting.jpg",
      file_name: "community-meeting.jpg",
      file_type: "image/jpeg",
      description: "Community intelligence sharing session with local village leaders",
      uploaded_at: "2026-03-12T15:00:00Z",
    },
  ],
  witnesses: [
    {
      id: 1,
      name: "Grace Mwangi",
      email: "grace@nationalparkrescue.org",
      organization: "National Park Rescue",
      relationship: "Senior Ranger / Patrol Supervisor",
    },
    {
      id: 2,
      name: "Joseph Kamau",
      organization: "Local Village Council",
      relationship: "Village Elder",
    },
  ],
  verifications: [],
};
