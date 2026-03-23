import { Filter, MapPin, Star, X, Heart } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "motion/react";
import { useTrip } from "../context/TripContext";

const places = [
  {
    id: 1,
    name: "La Boqueria Secret Stalls",
    location: "El Raval, Barcelona",
    description: "Skip the tourist-packed main aisles. Back stalls serve the best jamón ibérico and fresh seafood.",
    price: "$$",
    duration: "1-2h",
    rating: 9.2,
    tags: ["SideQuest", "Food"],
    image: "barcelona market food",
  },
  {
    id: 2,
    name: "Bunkers del Carmel",
    location: "El Carmel, Barcelona",
    description: "Panoramic sunset views over the entire city. Bring wine and snacks for the perfect evening.",
    price: "$",
    duration: "2-3h",
    rating: 9.5,
    tags: ["SideQuest", "Views"],
    image: "barcelona sunset views",
  },
  {
    id: 3,
    name: "Gothic Quarter Walk",
    location: "Barri Gòtic, Barcelona",
    description: "Wander through medieval streets, hidden squares, and discover ancient Roman walls.",
    price: "$",
    duration: "2h",
    rating: 9.2,
    tags: ["SideQuest", "Culture"],
    image: "barcelona gothic quarter",
  },
  {
    id: 4,
    name: "Park Güell Hidden Spots",
    location: "Gràcia, Barcelona",
    description: "Early morning visits reveal quiet corners and the best light for photos before crowds arrive.",
    price: "$$",
    duration: "2-3h",
    rating: 9.4,
    tags: ["SideQuest", "Nature"],
    image: "park guell barcelona",
  },
  {
    id: 5,
    name: "El Born Market",
    location: "El Born, Barcelona",
    description: "Ancient ruins beneath a modern food hall. History meets amazing tapas and local wine.",
    price: "$$$",
    duration: "1-2h",
    rating: 8.9,
    tags: ["SideQuest", "Food"],
    image: "el born market barcelona",
  },
  {
    id: 6,
    name: "Retiro Park Rowboats",
    location: "Madrid Centro",
    description: "Rent a rowboat on the crystal palace lake. Perfect afternoon escape from the city heat.",
    price: "$",
    duration: "1-2h",
    rating: 9.0,
    tags: ["SideQuest", "Nature"],
    image: "madrid retiro park lake",
  },
  {
    id: 7,
    name: "Sobrino de Botín",
    location: "Madrid",
    description: "World's oldest restaurant (1725). Order the roast suckling pig—it's legendary.",
    price: "$$$",
    duration: "2h",
    rating: 9.3,
    tags: ["Must Do", "Food"],
    image: "madrid restaurant traditional",
  },
  {
    id: 8,
    name: "Prado Museum Highlights",
    location: "Madrid",
    description: "Skip the full tour. Hit Velázquez, Goya, and Bosch. 90 minutes of pure art history.",
    price: "$$",
    duration: "1.5h",
    rating: 9.6,
    tags: ["Must Do", "Culture"],
    image: "prado museum madrid",
  },
  {
    id: 9,
    name: "Malasaña Tapas Crawl",
    location: "Madrid",
    description: "Hipster neighborhood with the best vermouth bars. 3 stops, 3 hours, endless tapas.",
    price: "$$",
    duration: "3h",
    rating: 9.4,
    tags: ["SideQuest", "Food"],
    image: "madrid malasana tapas",
  },
  {
    id: 10,
    name: "Tram 28 Full Loop",
    location: "Alfama, Lisbon",
    description: "Historic yellow tram through Lisbon's steepest hills. Go early to avoid the crowds.",
    price: "$",
    duration: "45min",
    rating: 8.8,
    tags: ["Must Do", "Views"],
    image: "lisbon tram 28",
  },
  {
    id: 11,
    name: "LX Factory Sunset",
    location: "Alcântara, Lisbon",
    description: "Converted factory complex with street art, rooftop bars, and river views at golden hour.",
    price: "$$",
    duration: "2h",
    rating: 9.1,
    tags: ["SideQuest", "Views"],
    image: "lisbon lx factory",
  },
  {
    id: 12,
    name: "Pastéis de Belém",
    location: "Belém, Lisbon",
    description: "The original custard tart recipe since 1837. There's a reason locals queue here daily.",
    price: "$",
    duration: "30min",
    rating: 9.7,
    tags: ["Must Do", "Food"],
    image: "lisbon pasteis belem",
  },
];

export function Discover() {
  const { activeTrip } = useTrip();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [intensity, setIntensity] = useState(0);
  const sliderX = useMotionValue(0);

  // Use cities from active trip if available, otherwise show default
  const cities = activeTrip 
    ? activeTrip.cities.map((city, index) => ({ 
        name: city.name, 
        flag: city.flag, 
        active: index === 0 
      }))
    : [
        { name: "Barcelona", flag: "🇪🇸", active: true },
        { name: "Madrid", flag: "🇪🇸", active: false },
        { name: "Lisbon", flag: "🇵🇹", active: false },
      ];

  const removeCard = (direction: "left" | "right") => {
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % places.length);
      setIntensity(0);
      sliderX.set(0);
    }, 300);
  };

  const handleSliderDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const sliderWidth = 280;
    const maxOffset = sliderWidth / 2 - 24;
    const normalizedValue = Math.max(-1, Math.min(1, info.offset.x / maxOffset));
    setIntensity(normalizedValue);
  };

  const handleSliderDragEnd = () => {
    if (intensity < -0.65) {
      removeCard("left");
    } else if (intensity > 0.65) {
      removeCard("right");
    } else {
      setIntensity(0);
    }
    sliderX.set(0);
  };

  const currentPlace = places[currentIndex];
  const remainingCards = places.length - currentIndex;

  return (
    <div className="px-5 py-4 h-screen flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-5 pt-1">
        <h1 className="text-[28px] tracking-tight text-zinc-900 dark:text-white">Discover</h1>
        <button className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent">
          <Filter className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        </button>
      </div>

      {/* City Pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {cities.map((city) => (
          <button
            key={city.name}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all ${
              city.active
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm dark:shadow-none border border-zinc-200/50 dark:border-transparent"
            }`}
          >
            <span className="text-lg">{city.flag}</span>
            <span className="text-[15px] font-medium">{city.name}</span>
          </button>
        ))}
      </div>

      {/* Card Stack */}
      <div className="flex-1 relative mb-5 min-h-0">
        {remainingCards > 0 ? (
          <>
            {/* Background cards */}
            {currentIndex + 1 < places.length && (
              <div 
                className="absolute inset-0 rounded-[28px] bg-zinc-300/40 dark:bg-zinc-900/60 backdrop-blur-sm"
                style={{ 
                  transform: 'scale(0.95) translateY(8px)',
                  zIndex: 1,
                }}
              />
            )}
            {currentIndex + 2 < places.length && (
              <div 
                className="absolute inset-0 rounded-[28px] bg-zinc-300/25 dark:bg-zinc-800/40"
                style={{ 
                  transform: 'scale(0.90) translateY(16px)',
                  zIndex: 0,
                }}
              />
            )}

            {/* Current Card */}
            <SwipeCard
              place={currentPlace}
              onSwipe={removeCard}
              intensity={intensity}
              key={currentPlace.id}
            />
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center px-8">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl text-zinc-900 dark:text-white mb-2">All Caught Up!</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-[15px]">Check back later for more recommendations</p>
            </div>
          </div>
        )}
      </div>

      {/* Intensity Slider */}
      <div className="pb-1">
        <div className="flex justify-between items-center text-[13px] text-zinc-600 dark:text-zinc-400 mb-3 px-1 font-medium">
          <div className="flex items-center gap-1.5">
            <X className="w-4 h-4 text-red-500 dark:text-red-400" />
            <span>Pass</span>
          </div>
          <span className="text-zinc-400 dark:text-zinc-500 tracking-wider text-[11px] uppercase">Intensity</span>
          <div className="flex items-center gap-1.5">
            <span>Save</span>
            <Heart className="w-4 h-4 text-teal-500 dark:text-teal-400" />
          </div>
        </div>

        {/* Gradient Slider */}
        <div className="relative h-[60px] rounded-full bg-gradient-to-r from-red-50 dark:from-red-950/30 via-zinc-100 dark:via-zinc-900 to-teal-50 dark:to-teal-950/30 border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg dark:shadow-xl">
          {/* Active gradient overlay */}
          <div 
            className="absolute inset-0 transition-all duration-150"
            style={{
              background: intensity < 0 
                ? `linear-gradient(to right, rgba(239, 68, 68, ${Math.abs(intensity) * 0.5}), transparent 60%)`
                : intensity > 0
                ? `linear-gradient(to left, rgba(20, 184, 166, ${intensity * 0.5}), transparent 60%)`
                : 'transparent'
            }}
          />

          {/* Center indicator line */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-8 bg-zinc-300 dark:bg-zinc-700/50" />

          {/* Draggable Circle */}
          <motion.div
            drag="x"
            dragConstraints={{ left: -130, right: 130 }}
            dragElastic={0.05}
            onDrag={handleSliderDrag}
            onDragEnd={handleSliderDragEnd}
            style={{ x: sliderX }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52px] h-[52px] rounded-full bg-zinc-900 dark:bg-white shadow-2xl cursor-grab active:cursor-grabbing flex items-center justify-center z-10"
            animate={{
              scale: Math.abs(intensity) > 0.4 ? 1.15 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {intensity < -0.3 && <X className="w-6 h-6 text-white dark:text-red-500" strokeWidth={2.5} />}
            {intensity > 0.3 && <Heart className="w-6 h-6 text-white dark:text-teal-500 fill-current" />}
            {Math.abs(intensity) <= 0.3 && (
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-white dark:bg-zinc-300" />
                <div className="w-1 h-1 rounded-full bg-white dark:bg-zinc-300" />
                <div className="w-1 h-1 rounded-full bg-white dark:bg-zinc-300" />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

interface SwipeCardProps {
  place: typeof places[0];
  onSwipe: (direction: "left" | "right") => void;
  intensity: number;
}

function SwipeCard({ place, onSwipe, intensity }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 120) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, opacity }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      whileTap={{ cursor: "grabbing" }}
      animate={{ 
        x: intensity * 45,
        rotate: intensity * 8,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="h-full rounded-[28px] overflow-hidden bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200/50 dark:border-transparent flex flex-col">
        {/* Image */}
        <div className="relative flex-1 min-h-0 bg-gradient-to-br from-orange-900 to-orange-700">
          <ImageWithFallback
            src={`https://source.unsplash.com/featured/?${place.image}`}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
          
          {/* Swipe Indicators */}
          <motion.div 
            className="absolute top-6 left-6 bg-red-500 text-white px-5 py-2.5 rounded-xl text-lg font-bold rotate-[-15deg] border-[3px] border-white shadow-2xl"
            animate={{ opacity: intensity < -0.3 ? 1 : 0, scale: intensity < -0.3 ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
          >
            PASS
          </motion.div>
          <motion.div 
            className="absolute top-6 right-6 bg-teal-500 text-white px-5 py-2.5 rounded-xl text-lg font-bold rotate-[15deg] border-[3px] border-white shadow-2xl"
            animate={{ opacity: intensity > 0.3 ? 1 : 0, scale: intensity > 0.3 ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
          >
            SAVE
          </motion.div>

          {/* Tags */}
          <div className="absolute top-5 left-5 right-5 flex justify-between">
            <span className="bg-orange-600 text-white px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-md shadow-lg">
              {place.tags[0]}
            </span>
            <span className="bg-white/95 text-black px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-md shadow-lg">
              {place.tags[1]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white p-6">
          <div className="mb-4">
            <h3 className="text-[22px] leading-tight mb-2 font-semibold text-zinc-900 dark:text-white">{place.name}</h3>
            
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-3">
              <MapPin className="w-4 h-4" strokeWidth={2} />
              <span className="text-[15px]">{place.location}</span>
            </div>

            <p className="text-zinc-600 dark:text-zinc-400 text-[15px] leading-relaxed">
              {place.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <span className="text-zinc-700 dark:text-zinc-300 text-[15px] font-medium">{place.price}</span>
              <span className="text-zinc-500 dark:text-zinc-400 text-[14px]">{place.duration}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full border border-amber-100 dark:border-transparent">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-[15px] font-semibold text-zinc-900 dark:text-amber-400">{place.rating}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}