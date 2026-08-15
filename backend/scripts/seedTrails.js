const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Trail = require('../src/models/Trail');
const Review = require('../src/models/Review');
const Favorite = require('../src/models/Favorite');

const trailsSeedData = [
  // MUMBAI & RAIGAD REGION
  {
    name: "Karnala Fort",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    latitude: 18.8897,
    longitude: 73.1194,
    difficulty: "Easy",
    distance: "4.8 km",
    distanceNum: 4.8,
    elevation: "445 m",
    elevationNum: 445,
    hikingTime: "2-2.5 hrs",
    bestTime: "Jul - Feb",
    rating: 4.6,
    reviewCount: 94,
    description:
      "Perched inside the Karnala Bird Sanctuary near Panvel (Navi Mumbai), Karnala Fort is renowned for its 125-foot basalt rock thumb pinnacle. A gentle forest trail takes hikers past exotic birds, teak trees, and panoramic vistas of the Sahyadri range.",
    safetyTips: [
      "Sanctuary entry fee required at the base gate",
      "Stay on marked paths to avoid disturbing wildlife",
      "Carry at least 2 liters of drinking water",
      "Climbing the pinnacle is strictly prohibited without technical gear"
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Karnala_Bird_Sanctuary_Fort.jpg/800px-Karnala_Bird_Sanctuary_Fort.jpg",
    imageAuthor: "Wikimedia Commons Contributor",
    imageLicense: "CC BY-SA 4.0",
    imageAttribution: "Photo by Rohit Saxena via Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Karnala_Bird_Sanctuary_Fort.jpg",
    isPopular: true
  },
  {
    name: "Kalavantin Durg",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    latitude: 18.9839,
    longitude: 73.2275,
    difficulty: "Hard",
    distance: "7.2 km",
    distanceNum: 7.2,
    elevation: "686 m",
    elevationNum: 686,
    hikingTime: "3.5-4 hrs",
    bestTime: "Oct - Mar",
    rating: 4.8,
    reviewCount: 142,
    description:
      "Famous globally for its steep rock-cut zigzag steps ascending a 2,250-foot pinnacle with no guard rails, Kalavantin Durg near Panvel offers one of the most thrilling climbs in Maharashtra, overlooking Prabalgad plateau and Matheran hills.",
    safetyTips: [
      "Avoid in heavy rains due to slippery exposed rock steps",
      "Requires high tolerance for steep heights",
      "Wear trekking shoes with high traction",
      "Start by 6:00 AM from Thakurwadi base"
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Kalavantin_Durg_Steps.jpg/800px-Kalavantin_Durg_Steps.jpg",
    imageAuthor: "Trekking Enthusiast",
    imageLicense: "CC BY-SA 3.0",
    imageAttribution: "Photo via Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Kalavantin_Durg_Steps.jpg",
    isPopular: true
  },
  {
    name: "Prabalgad Fort",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    latitude: 18.9748,
    longitude: 73.2272,
    difficulty: "Moderate",
    distance: "6.5 km",
    distanceNum: 6.5,
    elevation: "700 m",
    elevationNum: 700,
    hikingTime: "3 hrs",
    bestTime: "Jul - Feb",
    rating: 4.5,
    reviewCount: 68,
    description:
      "Adjacent to Kalavantin Durg, Prabalgad is a flat-topped tableland fort commanding sweeping views of Panvel, Ulhas river, and Mumbai harbor on clear days. Ancient ruins and natural rock pools dot the summit plateau.",
    safetyTips: [
      "Carry ample water and light snacks",
      "Follow forest trail markers carefully",
      "Wear full-length trekking trousers"
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Prabalgad_Fort.jpg/800px-Prabalgad_Fort.jpg",
    imageAuthor: "Wikimedia Contributor",
    imageLicense: "CC BY-SA",
    imageAttribution: "Photo via Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Prabalgad_Fort.jpg",
    isPopular: false
  },
  {
    name: "Peb Fort (Vikatgad)",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    latitude: 19.0194,
    longitude: 73.2847,
    difficulty: "Moderate",
    distance: "6.0 km",
    distanceNum: 6.0,
    elevation: "640 m",
    elevationNum: 640,
    hikingTime: "2.5-3 hrs",
    bestTime: "Jul - Feb",
    rating: 4.7,
    reviewCount: 88,
    description:
      "Named after goddess Pebi Devi, Peb Fort near Neral offers a diverse trail through railway tracks, iron ladders, rock traverses, and caves, with magnificent views of Matheran toy train tracks below.",
    safetyTips: [
      "Take care when stepping onto ridge ladders",
      "Carry a headlamp if starting before dawn",
      "Stay hydrated during humid morning ascents"
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Vikatgad_Peb_Fort.jpg/800px-Vikatgad_Peb_Fort.jpg",
    imageAuthor: "Wikimedia Contributor",
    imageLicense: "CC BY-SA 4.0",
    imageAttribution: "Photo via Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Vikatgad_Peb_Fort.jpg",
    isPopular: false
  },
  {
    name: "Garbett Plateau",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    latitude: 18.9954,
    longitude: 73.3087,
    difficulty: "Moderate",
    distance: "9.0 km",
    distanceNum: 9.0,
    elevation: "790 m",
    elevationNum: 790,
    hikingTime: "4 hrs",
    bestTime: "Jul - Nov",
    rating: 4.7,
    reviewCount: 110,
    description:
      "Starting from Bhivpuri railway station, this scenic monsoon trail winds around Dhom Dam lake, climbs steep green ridges, and culminates on the vast windy Garbett Plateau leading into Matheran hill station.",
    safetyTips: [
      "High wind speeds on the plateau ridge",
      "Start early from Bhivpuri station",
      "Wear water-resistant trekking boots"
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Garbett_Point_Matheran.jpg/800px-Garbett_Point_Matheran.jpg",
    imageAuthor: "Sahyadri Trekkers",
    imageLicense: "CC BY-SA 3.0",
    imageAttribution: "Photo via Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Garbett_Point_Matheran.jpg",
    isPopular: true
  },

  // LONAVALA & KHANDALA REGION
  {
    name: "Lohagad Fort",
    city: "Lonavala",
    state: "Maharashtra",
    country: "India",
    latitude: 18.7094,
    longitude: 73.4789,
    difficulty: "Easy",
    distance: "4.1 km",
    distanceNum: 4.1,
    elevation: "1,033 m",
    elevationNum: 1033,
    hikingTime: "1.5-2 hrs",
    bestTime: "Jul - Feb",
    rating: 4.5,
    reviewCount: 70,
    description:
      "Lohagad (Iron Fort) is one of the most accessible and picturesque hill forts in Maharashtra. Renowned for its iconic 'Vinchukata' (Scorpion's Tail) fortification that extends far out into the misty valley, it is ideal for beginners and families alike.",
    safetyTips: [
      "Wear shoes with rubber soles for stone steps",
      "Watch step on the narrow Vinchukata ridge",
      "Carry light rainwear in monsoon",
      "Stay hydrated during warm afternoons"
    ],
    imageUrl: "/images/lohagad.png",
    imageAuthor: "TrailExplorer",
    imageLicense: "CC BY-SA",
    imageAttribution: "Lohagad Fort Scorpion Ridge",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Lohagad_Fort.jpg",
    isPopular: true
  },
  {
    name: "Visapur Fort",
    city: "Lonavala",
    state: "Maharashtra",
    country: "India",
    latitude: 18.7208,
    longitude: 73.4892,
    difficulty: "Moderate",
    distance: "5.5 km",
    distanceNum: 5.5,
    elevation: "1,084 m",
    elevationNum: 1084,
    hikingTime: "2.5 hrs",
    bestTime: "Jul - Dec",
    rating: 4.7,
    reviewCount: 105,
    description:
      "Twin fortress to Lohagad, Visapur is celebrated for its spectacular waterfall trail where hikers trek directly up stone steps while fresh monsoon streams cascade down, leading to an expansive plateau with intact bastions.",
    safetyTips: [
      "Water flows down staircase during monsoon—use walking sticks",
      "Watch out for mossy slippery rock patches",
      "Carry waterproof phone pouch"
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Visapur_Fort_Trail.jpg/800px-Visapur_Fort_Trail.jpg",
    imageAuthor: "Maharashtra Tourism",
    imageLicense: "CC BY-SA",
    imageAttribution: "Visapur Waterfall Trek",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Visapur_Fort_Trail.jpg",
    isPopular: true
  },
  {
    name: "Rajmachi Fort",
    city: "Lonavala",
    state: "Maharashtra",
    country: "India",
    latitude: 18.8267,
    longitude: 73.3986,
    difficulty: "Moderate",
    distance: "14.0 km",
    distanceNum: 14.0,
    elevation: "825 m",
    elevationNum: 825,
    hikingTime: "4-5 hrs",
    bestTime: "Jun - Feb",
    rating: 4.8,
    reviewCount: 130,
    description:
      "A legendary trail in the Sahyadri mountains comprising twin citadels: Shrivardhan and Manaranjan. The trek from Udhewadi village features ancient water tanks, dense forest trails, fireflies in pre-monsoon, and breathtaking views of Kataldhar waterfall.",
    safetyTips: [
      "Long distance trail—carry sufficient energy bars and hydration",
      "Pre-monsoon firefly season is ideal for night camping",
      "Wear sturdy waterproof hiking boots"
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Rajmachi_Fort_View.jpg/800px-Rajmachi_Fort_View.jpg",
    imageAuthor: "Trekker Contributor",
    imageLicense: "CC BY-SA",
    imageAttribution: "Rajmachi Twin Forts",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Rajmachi_Fort_View.jpg",
    isPopular: true
  },
  {
    name: "Korigad Fort",
    city: "Lonavala",
    state: "Maharashtra",
    country: "India",
    latitude: 18.6253,
    longitude: 73.3853,
    difficulty: "Easy",
    distance: "3.5 km",
    distanceNum: 3.5,
    elevation: "923 m",
    elevationNum: 923,
    hikingTime: "1.5 hrs",
    bestTime: "Jul - Mar",
    rating: 4.6,
    reviewCount: 82,
    description:
      "Situated near Aamby Valley, Korigad is a pristine hill fort surrounded by two fresh water lakes on its summit plateau. The entire 2-kilometer fort wall perimeter remains intact and offers an easy walk with stunning valley views.",
    safetyTips: [
      "Very friendly trek for beginners and children",
      "Wear rubber sole shoes for stone steps",
      "Pack light and stay hydrated"
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Korigad_Fort_Maharashtra.jpg/800px-Korigad_Fort_Maharashtra.jpg",
    imageAuthor: "Wikimedia Contributor",
    imageLicense: "CC BY-SA",
    imageAttribution: "Korigad Fort Ramparts",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Korigad_Fort_Maharashtra.jpg",
    isPopular: false
  },

  // PUNE REGION
  {
    name: "Rajgad Fort",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    latitude: 18.2562,
    longitude: 73.6826,
    difficulty: "Moderate",
    distance: "5.2 km",
    distanceNum: 5.2,
    elevation: "1,374 m",
    elevationNum: 1374,
    hikingTime: "2-3 hrs",
    bestTime: "Oct - Mar",
    rating: 4.8,
    reviewCount: 120,
    description:
      "Rajgad is a historical fort with beautiful sceneries and a thrilling trekking experience. The trail offers lush green views, ancient caves, and fortification remains. Known as the King of Forts, it served as the royal capital of the Maratha Empire under Chhatrapati Shivaji Maharaj for over 26 years.",
    safetyTips: [
      "Carry enough water (at least 2-3 liters)",
      "Wear proper trekking shoes with strong grip",
      "Avoid plastic and carry back all trash",
      "Start early in the morning to beat the heat",
      "Carry basic first aid supplies"
    ],
    imageUrl: "/images/rajgad.png",
    imageAuthor: "TrailExplorer",
    imageLicense: "CC BY-SA",
    imageAttribution: "Rajgad Fort Balekilla & Machi",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Rajgad_Fort.jpg",
    isPopular: true
  },
  {
    name: "Sinhagad Fort",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    latitude: 18.3663,
    longitude: 73.7558,
    difficulty: "Moderate",
    distance: "6.5 km",
    distanceNum: 6.5,
    elevation: "1,312 m",
    elevationNum: 1312,
    hikingTime: "2-3 hrs",
    bestTime: "Jul - Feb",
    rating: 4.7,
    reviewCount: 98,
    description:
      "Sinhagad (The Lion's Fort) is perched on an isolated cliff with a rich history of valor and sacrifice. The trekking trail from Atkarwadi village climbs steadily through forested slopes, rewarding hikers with panoramic vistas of Khadakwasla Dam and delicious local delicacies like Kanda Bhaji and Pithla Bhakri at the top.",
    safetyTips: [
      "Carry enough water for the climb",
      "Wear comfortable trekking shoes",
      "Beware of slippery patches during monsoon",
      "Stay on designated trail paths",
      "Avoid feeding wild monkeys along the way"
    ],
    imageUrl: "/images/sinhagad.png",
    imageAuthor: "TrailExplorer",
    imageLicense: "CC BY-SA",
    imageAttribution: "Sinhagad Fort Pune",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sinhagad_Fort.jpg",
    isPopular: true
  },
  {
    name: "Torna Fort",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    latitude: 18.2778,
    longitude: 73.6231,
    difficulty: "Hard",
    distance: "8.7 km",
    distanceNum: 8.7,
    elevation: "1,403 m",
    elevationNum: 1403,
    hikingTime: "3.5-4.5 hrs",
    bestTime: "Sep - Feb",
    rating: 4.6,
    reviewCount: 85,
    description:
      "Also known as Prachandagad, Torna is the highest hill-fort in Pune district and the first fort captured by young Shivaji Maharaj in 1646. The trek starts from Velhe and features steep climbs, rock patches, and the dramatic Zunjar Machi and Budhla Machi ridges.",
    safetyTips: [
      "Requires good endurance and cardiovascular fitness",
      "Sturdy footwear with ankle support is strongly advised",
      "Carry at least 3 liters of water and energy snacks",
      "Avoid exposed ridge sections during high wind storms",
      "Start by 6 AM to complete the trek safely before sunset"
    ],
    imageUrl: "/images/torna.png",
    imageAuthor: "TrailExplorer",
    imageLicense: "CC BY-SA",
    imageAttribution: "Torna Fort Prachandagad",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Torna_Fort.jpg",
    isPopular: true
  },
  {
    name: "Tikona Fort",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    latitude: 18.6322,
    longitude: 73.5186,
    difficulty: "Easy",
    distance: "3.8 km",
    distanceNum: 3.8,
    elevation: "1,064 m",
    elevationNum: 1064,
    hikingTime: "1.5 hrs",
    bestTime: "Jul - Feb",
    rating: 4.5,
    reviewCount: 64,
    description:
      "Tikona (Vitandgad) is a triangular hill fort near Pawna Lake. Its steep rock-cut steps with steel railings lead up to a grand entrance gate and a Trimbakeshwar Mahadev temple with 360-degree views of Pawna Dam and Tung Fort.",
    safetyTips: [
      "Steep stairs near the top have safety railings",
      "Windy summit plateau—hold onto hats and cameras",
      "Ideal beginner hike in Pune district"
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Tikona_Fort.jpg/800px-Tikona_Fort.jpg",
    imageAuthor: "Wikimedia Contributor",
    imageLicense: "CC BY-SA",
    imageAttribution: "Tikona Fort Pawna",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tikona_Fort.jpg",
    isPopular: false
  },

  // NASHIK & AHMEDNAGAR REGION
  {
    name: "Kalsubai Peak",
    city: "Nashik",
    state: "Maharashtra",
    country: "India",
    latitude: 19.6011,
    longitude: 73.7119,
    difficulty: "Hard",
    distance: "12.3 km",
    distanceNum: 12.3,
    elevation: "1,646 m",
    elevationNum: 1646,
    hikingTime: "4-5 hrs",
    bestTime: "Sep - Mar",
    rating: 4.8,
    reviewCount: 115,
    description:
      "Kalsubai is the Everest of Maharashtra, standing proudly as the highest peak in the Western Ghats of the state at 1,646 meters (5,400 ft). The trek from Bari village traverses lush meadows, steep rocky inclines fitted with steel ladders, leading to a small summit temple with 360-degree views of surrounding reservoirs.",
    safetyTips: [
      "Climb steel ladders one person at a time",
      "Carry minimum 3-4 liters of water and ORS electrolytes",
      "Night trekking requires high-powered headlamps",
      "Warm clothing needed at the windy peak summit",
      "Avoid reckless selfie positions near open drop-offs"
    ],
    imageUrl: "/images/kalsubai.png",
    imageAuthor: "TrailExplorer",
    imageLicense: "CC BY-SA",
    imageAttribution: "Mount Kalsubai Highest Peak",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Kalsubai_Peak.jpg",
    isPopular: true
  },
  {
    name: "Harishchandragad",
    city: "Ahmednagar",
    state: "Maharashtra",
    country: "India",
    latitude: 19.3872,
    longitude: 73.7770,
    difficulty: "Moderate",
    distance: "9.6 km",
    distanceNum: 9.6,
    elevation: "1,424 m",
    elevationNum: 1424,
    hikingTime: "3.5-4 hrs",
    bestTime: "Oct - Feb",
    rating: 4.7,
    reviewCount: 92,
    description:
      "Harishchandragad is an ancient hill fort renowned worldwide for the jaw-dropping Konkan Kada—a massive concave vertical cliff face dropping over 2,000 feet straight into Konkan. The site also houses the 6th-century Harishchvalueshwar temple, Kedareshwar Cave with its monolithic Shivling surrounded by ice-cold water, and Taramati peak.",
    safetyTips: [
      "Keep safe distance from the edge of Konkan Kada",
      "Carry a sturdy torch if exploring caves",
      "Stay hydrated and carry energy bars",
      "Respect ancient heritage structures and temple grounds"
    ],
    imageUrl: "/images/harishchandragad.png",
    imageAuthor: "TrailExplorer",
    imageLicense: "CC BY-SA",
    imageAttribution: "Harishchandragad Konkan Kada",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Harishchandragad_Fort.jpg",
    isPopular: true
  },
  {
    name: "Harihar Fort",
    city: "Nashik",
    state: "Maharashtra",
    country: "India",
    latitude: 19.9042,
    longitude: 73.4739,
    difficulty: "Hard",
    distance: "5.8 km",
    distanceNum: 5.8,
    elevation: "1,120 m",
    elevationNum: 1120,
    hikingTime: "3 hrs",
    bestTime: "Oct - Feb",
    rating: 4.9,
    reviewCount: 156,
    description:
      "Harihar Fort (Harshagad) near Trimbakeshwar is internationally famous for its iconic 80-degree vertical stone-carved steps carved into a sheer rock face with carved notches for hand grips.",
    safetyTips: [
      "Extremely steep rock staircase—three-point contact required",
      "Avoid descending during heavy downpours",
      "Wear climbing shoes with supreme rubber grip"
    ],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Harihar_Fort_Steps.jpg/800px-Harihar_Fort_Steps.jpg",
    imageAuthor: "Sahyadri Heritage",
    imageLicense: "CC BY-SA 4.0",
    imageAttribution: "Harihar Rock Cut Steps",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Harihar_Fort_Steps.jpg",
    isPopular: true
  }
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hiking-trail-explorer';
    console.log(`Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Trail.deleteMany({});
    await Review.deleteMany({});
    await Favorite.deleteMany({});

    console.log('Creating Admin & Demo User accounts...');
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@12345', salt);
    const userPasswordHash = await bcrypt.hash('User@12345', salt);

    const admin = await User.create({
      name: 'Admin Manager',
      email: 'admin@trailexplorer.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      profileImage: '/images/avatar.png',
      bio: 'Lead Trail Administrator & Route Curator at TrailExplorer.'
    });

    const demoUser = await User.create({
      name: 'Aniket Patil',
      email: 'aniketpatil@gmail.com',
      passwordHash: userPasswordHash,
      role: 'user',
      profileImage: '/images/avatar.png',
      bio: 'Passionate Sahyadri trekker and mountain photography lover. Explored 15+ high altitude forts in Western Ghats.',
      trailsExplored: 15
    });

    console.log('Seeding Trails...');
    const preparedTrails = trailsSeedData.map((t) => ({
      ...t,
      slug: t.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
      location: {
        type: 'Point',
        coordinates: [t.longitude, t.latitude]
      }
    }));
    const createdTrails = await Trail.insertMany(preparedTrails);
    console.log(`Successfully seeded ${createdTrails.length} trails.`);

    console.log('Creating initial reviews and favorites...');
    const rajgad = createdTrails.find((t) => t.name === 'Rajgad Fort');
    const sinhagad = createdTrails.find((t) => t.name === 'Sinhagad Fort');
    const lohagad = createdTrails.find((t) => t.name === 'Lohagad Fort');
    const kalsubai = createdTrails.find((t) => t.name === 'Kalsubai Peak');

    if (rajgad && demoUser) {
      await Review.create({
        user: demoUser._id,
        trail: rajgad._id,
        rating: 5,
        comment:
          'Incredible trek! The views from Balekilla are absolutely breathtaking. Highly recommend starting before 6 AM.'
      });
      await Favorite.create({ user: demoUser._id, trail: rajgad._id });
    }

    if (sinhagad && demoUser) {
      await Review.create({
        user: demoUser._id,
        trail: sinhagad._id,
        rating: 5,
        comment: 'Best weekend morning hike in Pune. The hot pithla bhakri at top makes every drop of sweat worth it!'
      });
      await Favorite.create({ user: demoUser._id, trail: sinhagad._id });
    }

    if (lohagad && demoUser) {
      await Favorite.create({ user: demoUser._id, trail: lohagad._id });
    }

    if (kalsubai && demoUser) {
      await Favorite.create({ user: demoUser._id, trail: kalsubai._id });
    }

    console.log('==============================================');
    console.log('DATABASE SEED COMPLETE!');
    console.log('Admin Login: admin@trailexplorer.com / Admin@12345');
    console.log('User Login: aniketpatil@gmail.com / User@12345');
    console.log('==============================================');

    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
}

seedDatabase();
