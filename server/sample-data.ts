import { InsertPost, InsertReel } from "@shared/schema";

// Adding createdAt for posts that will be manually added to the database
type PostWithLikes = InsertPost & {
  likes: number;
  createdAt?: Date;
};

// User type for reels
type ReelUser = {
  id: number;
  username: string;
  fullName: string | null;
  profilePicture: string | null;
};

// Adding reels with metadata
type ReelWithMeta = InsertReel & {
  likes: number;
  views: number;
  createdAt?: Date;
  thumbnail?: string;
  user?: ReelUser;
};

// Sample user data for reels
const reelUsers = [
  {
    id: 1,
    username: "testuser1",
    fullName: "Test User",
    profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop"
  },
  {
    id: 2,
    username: "RAJESH_CHIKKY",
    fullName: "RAJESH",
    profilePicture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop"
  },
  {
    id: 3,
    username: "testuser2",
    fullName: "Test User 2",
    profilePicture: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop"
  },
  {
    id: 4,
    username: "indian_chef",
    fullName: "Priya Sharma",
    profilePicture: "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?w=150&auto=format&fit=crop"
  },
  {
    id: 5,
    username: "travel_india",
    fullName: "Arjun Patel",
    profilePicture: "https://images.unsplash.com/photo-1618641986557-1ecd230959aa?w=150&auto=format&fit=crop"
  }
];

export const sampleReels: ReelWithMeta[] = [
  {
    userId: 1,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnail: "https://images.unsplash.com/photo-1627483262769-04d0a1401487?w=800&auto=format&fit=crop",
    caption: "Incredible street market in Delhi! 🛍️ #Delhi #IndianMarket #Shopping",
    likes: 3452,
    views: 15240,
    filter: "warm",
    audioTrack: "Bollywood Beat",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    user: reelUsers[0]
  },
  {
    userId: 2,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnail: "https://images.unsplash.com/photo-1600255821009-45c01f8ead49?w=800&auto=format&fit=crop",
    caption: "Traditional Bharatanatyam dance performance in Chennai 💃 #IndianClassicalDance #Chennai",
    likes: 6789,
    views: 25670,
    filter: "sepia",
    audioTrack: "Tamil Classic",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    user: reelUsers[1]
  },
  {
    userId: 3,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnail: "https://images.unsplash.com/photo-1585136917549-6f29ccf1363a?w=800&auto=format&fit=crop",
    caption: "Cooking authentic butter chicken! Family recipe 🍗 #IndianFood #ButterChicken",
    likes: 8213,
    views: 42310,
    filter: "vibrant",
    audioTrack: "Punjabi Dance",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    user: reelUsers[2]
  },
  {
    userId: 4,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnail: "https://images.unsplash.com/photo-1519691413791-4c0b7e169676?w=800&auto=format&fit=crop",
    caption: "Road trip through the beautiful valleys of Kashmir 🚗 #Kashmir #MountainViews",
    likes: 4567,
    views: 19870,
    filter: "cool",
    audioTrack: "Folk Fusion",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    user: reelUsers[3]
  },
  {
    userId: 5,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    thumbnail: "https://images.unsplash.com/photo-1599030284416-bf4c0a53380a?w=800&auto=format&fit=crop",
    caption: "Learning to make traditional South Indian dosa! 🍽️ #SouthIndianFood #Dosa",
    likes: 5432,
    views: 23450,
    filter: "dramatic",
    audioTrack: "Kerala Rhythm",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    user: reelUsers[4]
  },
  {
    userId: 4,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/Elephants.mp4",
    thumbnail: "https://images.unsplash.com/photo-1585807515950-bc46d934c28b?w=800&auto=format&fit=crop",
    caption: "Traditional mehndi art for wedding season 💕 #Mehndi #IndianWedding",
    likes: 9876,
    views: 51230,
    filter: "vintage",
    audioTrack: "Bollywood Beat",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    user: reelUsers[3]
  },
  {
    userId: 3,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnail: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop",
    caption: "Sunrise at the Taj Mahal - simply breathtaking 🌅 #TajMahal #Agra #WonderOfTheWorld",
    likes: 12345,
    views: 87690,
    filter: "warm",
    audioTrack: "Folk Fusion",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    user: reelUsers[2]
  },
  {
    userId: 2,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    thumbnail: "https://images.unsplash.com/photo-1573480813647-552e9b7b5394?w=800&auto=format&fit=crop",
    caption: "Thrilling rafting experience in Rishikesh! 🌊 #Rishikesh #RiverRafting #Adventure",
    likes: 7834,
    views: 34560,
    filter: "cool",
    audioTrack: "Punjabi Dance",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    user: reelUsers[1]
  },
  {
    userId: 1,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
    thumbnail: "https://images.unsplash.com/photo-1533282960533-51328af49f78?w=800&auto=format&fit=crop",
    caption: "Street food tour in Mumbai! These vada pavs are incredible 😋 #MumbaiStreetFood #VadaPav",
    likes: 5678,
    views: 27890,
    filter: "vibrant",
    audioTrack: "Tamil Classic",
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
    user: reelUsers[0]
  },
  {
    userId: 5,
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    thumbnail: "https://images.unsplash.com/photo-1584831494993-0da9449deaee?w=800&auto=format&fit=crop",
    caption: "Celebrating Holi in Mathura - festival of colors! 🎨 #Holi #Mathura #FestivalOfColors",
    likes: 11223,
    views: 67890,
    filter: "dramatic",
    audioTrack: "Bollywood Beat",
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
    user: reelUsers[4]
  }
];

export const samplePosts: PostWithLikes[] = [
  {
    userId: 2,
    caption: "Enjoying the vibrant colors of Holi festival in Jaipur! 🎨 #HoliFestival #IndianCulture",
    imageUrl: "https://images.unsplash.com/photo-1613193695939-3223213faded?w=800&auto=format&fit=crop",
    location: "Jaipur, Rajasthan",
    likes: 1254,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    userId: 2,
    caption: "The majestic Taj Mahal at sunrise. A wonder of the world that never fails to amaze. ✨ #TajMahal #Agra #IncredibleIndia",
    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop",
    location: "Agra, Uttar Pradesh",
    likes: 3421,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    userId: 2,
    caption: "Spice market adventures in Delhi. The colors and aromas are incredible! 🌶️ #DelhiMarket #IndianSpices",
    imageUrl: "https://images.unsplash.com/photo-1592273869890-36e9598717d3?w=800&auto=format&fit=crop",
    location: "Chandni Chowk, Delhi",
    likes: 987,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },
  {
    userId: 2,
    caption: "Traditional South Indian thali - a feast for the senses! 🍛 #SouthIndianFood #IndianCuisine #FoodLover",
    imageUrl: "https://images.unsplash.com/photo-1606471191009-63994c53433b?w=800&auto=format&fit=crop",
    location: "Chennai, Tamil Nadu",
    likes: 1543,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  },
  {
    userId: 2,
    caption: "The backwaters of Kerala are truly God's own country 🌴 #Kerala #Backwaters #NaturePhotography",
    imageUrl: "https://images.unsplash.com/photo-1602215500421-1f65b4564859?w=800&auto=format&fit=crop",
    location: "Alleppey, Kerala",
    likes: 2102,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
  },
  {
    userId: 2,
    caption: "Magnificent ancient temples of Hampi. The architecture is breathtaking! 🏛️ #Hampi #AncientIndia #HistoricalSites",
    imageUrl: "https://images.unsplash.com/photo-1590050752117-78dde2d7e3b5?w=800&auto=format&fit=crop",
    location: "Hampi, Karnataka",
    likes: 876,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) // 12 days ago
  },
  {
    userId: 2,
    caption: "The chaotic beauty of Varanasi ghats during evening aarti 🪔 #Varanasi #GangaAarti #SpiritualIndia",
    imageUrl: "https://images.unsplash.com/photo-1617559746804-062c86ac2957?w=800&auto=format&fit=crop",
    location: "Varanasi, Uttar Pradesh",
    likes: 1876,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
  },
  {
    userId: 2,
    caption: "Desert safari in the Thar Desert. The golden sands stretching to infinity ✨ #TharDesert #Rajasthan #DesertSafari",
    imageUrl: "https://images.unsplash.com/photo-1588970698009-f8ea62f1857e?w=800&auto=format&fit=crop",
    location: "Jaisalmer, Rajasthan",
    likes: 2341,
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) // 18 days ago
  },
  {
    userId: 2,
    caption: "Practicing yoga at sunrise by the Ganges. Peace and serenity 🧘 #Yoga #RishikeshDiaries #MorningMeditation",
    imageUrl: "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800&auto=format&fit=crop",
    location: "Rishikesh, Uttarakhand",
    likes: 1234,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) // 20 days ago
  },
  {
    userId: 2,
    caption: "The vibrant streets of Mumbai never sleep! City of dreams ✨ #Mumbai #StreetPhotography #CityLife",
    imageUrl: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop",
    location: "Mumbai, Maharashtra",
    likes: 3210,
    createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000) // 22 days ago
  },
  {
    userId: 2,
    caption: "Traditional Kathakali performance in Kerala. The expressions are so powerful! 🎭 #Kathakali #IndianClassicalDance",
    imageUrl: "https://images.unsplash.com/photo-1584811644165-33996df19b70?w=800&auto=format&fit=crop",
    location: "Kochi, Kerala",
    likes: 876,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) // 25 days ago
  },
  {
    userId: 2,
    caption: "Exploring the lush tea plantations of Munnar. Green paradise! 🍃 #Munnar #TeaPlantations #Kerala",
    imageUrl: "https://images.unsplash.com/photo-1598324789736-4861f89564a0?w=800&auto=format&fit=crop",
    location: "Munnar, Kerala",
    likes: 1543,
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) // 28 days ago
  },
  {
    userId: 2,
    caption: "The magnificent Mysore Palace lit up at night. Royal grandeur at its best! 👑 #MysorePalace #RoyalIndia",
    imageUrl: "https://images.unsplash.com/photo-1621996659490-3275eeb2ed9d?w=800&auto=format&fit=crop",
    location: "Mysore, Karnataka",
    likes: 2876,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  },
  {
    userId: 2,
    caption: "Delicious street food of Kolkata - Puchkas/Pani Puri heaven! 😋 #KolkataStreetFood #FoodieParadise",
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop",
    location: "Kolkata, West Bengal",
    likes: 1321,
    createdAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000) // 33 days ago
  },
  {
    userId: 2,
    caption: "The colorful houses of Jodhpur - The Blue City. Such a unique view! 🏡 #Jodhpur #BlueCity #RajasthanTravel",
    imageUrl: "https://images.unsplash.com/photo-1544087105-44ec63a62ab1?w=800&auto=format&fit=crop",
    location: "Jodhpur, Rajasthan",
    likes: 2431,
    createdAt: new Date(Date.now() - 36 * 24 * 60 * 60 * 1000) // 36 days ago
  },
  {
    userId: 2,
    caption: "Celebrating Diwali with beautiful rangoli and diyas! Festival of lights ✨ #Diwali #FestivalOfLights #IndianFestival",
    imageUrl: "https://images.unsplash.com/photo-1635163713492-a177fe5cf2c8?w=800&auto=format&fit=crop",
    location: "Ahmedabad, Gujarat",
    likes: 3214,
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) // 40 days ago
  },
  {
    userId: 2,
    caption: "The holy city of Amritsar and its Golden Temple. Spiritual bliss! ✨ #GoldenTemple #Amritsar #SpiritualJourney",
    imageUrl: "https://images.unsplash.com/photo-1588096344356-9b047b9713fa?w=800&auto=format&fit=crop",
    location: "Amritsar, Punjab",
    likes: 2768,
    createdAt: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000) // 43 days ago
  },
  {
    userId: 2,
    caption: "The incredible Himalayan views from Darjeeling. Nature at its finest! 🏔️ #Darjeeling #Himalayas #MountainViews",
    imageUrl: "https://images.unsplash.com/photo-1626621331169-3f33990730d0?w=800&auto=format&fit=crop",
    location: "Darjeeling, West Bengal",
    likes: 1943,
    createdAt: new Date(Date.now() - 46 * 24 * 60 * 60 * 1000) // 46 days ago
  },
  {
    userId: 2,
    caption: "Learning the art of traditional block printing in Jaipur. Amazing craftsmanship! 🎨 #BlockPrinting #IndianHandicraft",
    imageUrl: "https://images.unsplash.com/photo-1604159332148-30f60e4bf5d5?w=800&auto=format&fit=crop",
    location: "Jaipur, Rajasthan",
    likes: 876,
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000) // 50 days ago
  },
  {
    userId: 2,
    caption: "Mumbai's iconic Gateway of India. A symbol of this beautiful city! 🏛️ #GatewayOfIndia #Mumbai #HistoricalMonument",
    imageUrl: "https://images.unsplash.com/photo-1567881248445-95a22485f179?w=800&auto=format&fit=crop",
    location: "Mumbai, Maharashtra",
    likes: 2143,
    createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) // 55 days ago
  }
];