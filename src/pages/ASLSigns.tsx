import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search, Hand, MessageCircle, Hash, Users, Zap, Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '@/components/AnimatedBackground';

interface ASLSign {
  name: string;
  description: string;
  howTo: string;
  category: 'greetings' | 'questions' | 'people' | 'verbs' | 'numbers' | 'alphabet' | 'emotions' | 'time';
  difficulty: 'easy' | 'medium' | 'hard';
  emoji?: string;
}

const aslSigns: ASLSign[] = [
  // GREETINGS & POLITENESS
  { name: 'HELLO', description: 'Open palm wave or salute from forehead', howTo: 'Open hand, all 5 fingers extended, wave slightly', category: 'greetings', difficulty: 'easy', emoji: '👋' },
  { name: 'GOODBYE', description: 'Open palm, fingers fold down or wave', howTo: 'Open hand, fingers fold down repeatedly', category: 'greetings', difficulty: 'easy', emoji: '👋' },
  { name: 'PLEASE', description: '⭐ Face+Hand: Flat hand rubs chest in a circle', howTo: 'Open palm on chest, make circular motion (camera sees face+chest)', category: 'greetings', difficulty: 'medium', emoji: '🙏' },
  { name: 'THANK YOU', description: '⭐ Face+Hand: Fingertips touch chin, then move outward', howTo: 'Fingers at chin, move hand forward/down (camera sees face)', category: 'greetings', difficulty: 'medium', emoji: '🙏' },
  { name: 'SORRY', description: '⭐ Face+Hand: Fist rubs chest in a circle', howTo: 'Closed fist, rub in circular motion on chest (camera sees face+chest)', category: 'greetings', difficulty: 'medium', emoji: '😔' },
  { name: 'EXCUSE ME', description: 'Fingertips brush across palm', howTo: 'One hand brushes the palm of the other', category: 'greetings', difficulty: 'medium', emoji: '✋' },
  { name: 'YES', description: 'Fist nods up and down like a head', howTo: 'Thumbs up, nod motion', category: 'greetings', difficulty: 'easy', emoji: '👍' },
  { name: 'NO', description: 'Index and middle finger tap thumb', howTo: 'Thumbs down or fingers snap shut', category: 'greetings', difficulty: 'easy', emoji: '👎' },
  { name: 'FINE / GOOD', description: 'Thumb touches chest, fingers spread', howTo: 'Thumbs up gesture', category: 'greetings', difficulty: 'easy', emoji: '👍' },

  // QUESTION WORDS
  { name: 'WHO', description: 'Index finger circles around the mouth', howTo: 'Index finger makes circle near mouth/chin', category: 'questions', difficulty: 'medium', emoji: '❓' },
  { name: 'WHAT', description: 'Palms up, shaking slightly side to side', howTo: 'Open hands, palms up, shake side to side', category: 'questions', difficulty: 'easy', emoji: '❓' },
  { name: 'WHERE', description: 'Index finger shakes side to side', howTo: 'Point with index, shake left and right', category: 'questions', difficulty: 'easy', emoji: '📍' },
  { name: 'WHEN', description: 'One index circles and touches other', howTo: 'Index finger circles then touches other index', category: 'questions', difficulty: 'medium', emoji: '⏰' },
  { name: 'WHY', description: 'Hand pulls from forehead into Y shape', howTo: 'Fingers at forehead, pull away into Y handshape', category: 'questions', difficulty: 'hard', emoji: '🤔' },
  { name: 'HOW', description: 'Knuckles touch, hands roll forward', howTo: 'Knuckles together, roll hands forward', category: 'questions', difficulty: 'medium', emoji: '❓' },
  { name: 'WHICH', description: 'Fists with thumbs up, alternating', howTo: 'Thumbs up, alternate up and down', category: 'questions', difficulty: 'medium', emoji: '🤷' },

  // PEOPLE & FAMILY
  { name: 'I / ME', description: 'Point to self', howTo: 'Index finger pointing at your chest', category: 'people', difficulty: 'easy', emoji: '👉' },
  { name: 'YOU', description: 'Point to person', howTo: 'Index finger pointing forward/at person', category: 'people', difficulty: 'easy', emoji: '☝️' },
  { name: 'HE / SHE / IT', description: 'Point to the side', howTo: 'Index finger pointing to the side', category: 'people', difficulty: 'easy', emoji: '👈' },
  { name: 'THEY', description: 'Point to group/sweep', howTo: 'Index finger sweeps across area', category: 'people', difficulty: 'easy', emoji: '👥' },
  { name: 'MOTHER / MOM', description: '⭐ Face+Hand: Thumb of open hand taps chin', howTo: 'Open hand, thumb taps chin repeatedly (camera sees face)', category: 'people', difficulty: 'medium', emoji: '👩' },
  { name: 'FATHER / DAD', description: '⭐ Face+Hand: Thumb of open hand taps forehead', howTo: 'Open hand, thumb taps forehead repeatedly (camera sees face)', category: 'people', difficulty: 'medium', emoji: '👨' },
  { name: 'BOY', description: 'Hand grabs imaginary cap brim', howTo: 'Hand makes grabbing motion at forehead (cap)', category: 'people', difficulty: 'medium', emoji: '👦' },
  { name: 'GIRL', description: 'Thumb strokes down jawline', howTo: 'Thumb traces along jaw/cheek', category: 'people', difficulty: 'medium', emoji: '👧' },
  { name: 'FAMILY', description: '"F" handshapes circle and touch', howTo: 'F handshape, make circular motion', category: 'people', difficulty: 'hard', emoji: '👨‍👩‍👧‍👦' },

  // EVERYDAY VERBS
  { name: 'EAT', description: '⭐ Face+Hand: Squished O hand touches mouth', howTo: 'Fingers together, tap mouth repeatedly (camera sees face)', category: 'verbs', difficulty: 'medium', emoji: '🍽️' },
  { name: 'DRINK', description: '⭐ Face+Hand: Mimic holding cup and tipping to mouth', howTo: 'Thumb near mouth, tilting motion (camera sees face)', category: 'verbs', difficulty: 'medium', emoji: '🥤' },
  { name: 'SLEEP', description: '⭐ Face+Hand: Hand closes over face as it moves down', howTo: 'Open hand closes near face, moves down (camera sees face)', category: 'verbs', difficulty: 'medium', emoji: '😴' },
  { name: 'GO', description: 'Index fingers point and move away', howTo: 'Point forward, move hand away from body', category: 'verbs', difficulty: 'easy', emoji: '🏃' },
  { name: 'COME', description: 'Index fingers point and move toward self', howTo: 'Point forward, bring fingers toward you', category: 'verbs', difficulty: 'easy', emoji: '🤝' },
  { name: 'WANT', description: 'Hands open, palms up, pull toward you', howTo: 'Open hands, pull toward body with claw motion', category: 'verbs', difficulty: 'medium', emoji: '🙋' },
  { name: 'LIKE', description: 'Thumb and middle finger pull from chest', howTo: 'Thumb and middle finger pinch and pull from chest', category: 'verbs', difficulty: 'medium', emoji: '👍' },
  { name: 'KNOW', description: '⭐ Face+Hand: Fingertips tap forehead', howTo: 'Fingertips tap temple/forehead (camera sees face)', category: 'verbs', difficulty: 'easy', emoji: '🧠' },
  { name: 'UNDERSTAND', description: 'Fist near head, index finger flicks up', howTo: 'Closed fist at head, index pops up like lightbulb', category: 'verbs', difficulty: 'medium', emoji: '💡' },
  { name: 'LEARN', description: 'Hand grabs from palm and puts to forehead', howTo: 'Open hand grabs air, moves to forehead', category: 'verbs', difficulty: 'hard', emoji: '📚' },
  { name: 'HELP', description: 'One hand supports the other', howTo: 'Thumbs up on flat palm, lift together', category: 'verbs', difficulty: 'medium', emoji: '🆘' },
  { name: 'STOP', description: 'Hand chops down on other palm', howTo: 'Closed fist or flat hand chops down', category: 'verbs', difficulty: 'easy', emoji: '✋' },

  // TIME
  { name: 'NOW', description: 'Y-hands drop down in front', howTo: 'Y handshape, drop down in front of body', category: 'time', difficulty: 'medium', emoji: '⏰' },
  { name: 'TODAY', description: 'Same as NOW, bounced twice', howTo: 'NOW sign with two bounces', category: 'time', difficulty: 'medium', emoji: '📅' },
  { name: 'TOMORROW', description: 'Thumb touches cheek, twists forward', howTo: 'Thumb at cheek, move forward', category: 'time', difficulty: 'medium', emoji: '🔜' },
  { name: 'YESTERDAY', description: 'Thumb touches cheek, moves backward', howTo: 'Thumb at cheek, move back toward ear', category: 'time', difficulty: 'medium', emoji: '⏪' },
  { name: 'MORNING', description: 'Arm rises up like sun', howTo: 'One arm horizontal, other rises up', category: 'time', difficulty: 'medium', emoji: '🌅' },
  { name: 'NIGHT', description: 'Hand cups over wrist like setting sun', howTo: 'Hand arcs down over other wrist', category: 'time', difficulty: 'medium', emoji: '🌙' },

  // NUMBERS (0-9)
  { name: 'ZERO', description: 'Fingers make O shape', howTo: 'Thumb and index touch, other fingers extended in O', category: 'numbers', difficulty: 'easy', emoji: '0️⃣' },
  { name: 'ONE', description: 'Index finger up', howTo: 'Only index finger extended', category: 'numbers', difficulty: 'easy', emoji: '1️⃣' },
  { name: 'TWO', description: 'Index and middle fingers up', howTo: 'Peace sign - index and middle extended', category: 'numbers', difficulty: 'easy', emoji: '2️⃣' },
  { name: 'THREE', description: 'Thumb, index, middle fingers up', howTo: 'Three fingers extended (thumb, index, middle)', category: 'numbers', difficulty: 'easy', emoji: '3️⃣' },
  { name: 'FOUR', description: 'Four fingers up (no thumb)', howTo: 'Index, middle, ring, pinky extended (thumb tucked)', category: 'numbers', difficulty: 'easy', emoji: '4️⃣' },
  { name: 'FIVE', description: 'All fingers extended', howTo: 'Open hand, all 5 fingers spread', category: 'numbers', difficulty: 'easy', emoji: '5️⃣' },
  { name: 'SIX', description: 'Three fingers up, thumb and pinky touch', howTo: 'Index, middle, ring up; thumb touches pinky', category: 'numbers', difficulty: 'medium', emoji: '6️⃣' },
  { name: 'SEVEN', description: 'Four fingers up, thumb on ring finger', howTo: 'Index, middle, pinky up; thumb touches ring', category: 'numbers', difficulty: 'medium', emoji: '7️⃣' },
  { name: 'EIGHT', description: 'Four fingers up, thumb on middle finger', howTo: 'Index, ring, pinky up; thumb touches middle', category: 'numbers', difficulty: 'medium', emoji: '8️⃣' },
  { name: 'NINE', description: 'Four fingers up, thumb on index', howTo: 'Middle, ring, pinky up; thumb touches index', category: 'numbers', difficulty: 'medium', emoji: '9️⃣' },

  // EMOTIONS
  { name: 'HAPPY', description: 'Open hands brush up chest twice', howTo: 'Flat hands on chest, brush upward', category: 'emotions', difficulty: 'easy', emoji: '😊' },
  { name: 'SAD', description: 'Hands slide down face', howTo: 'Open hands near face, slide downward', category: 'emotions', difficulty: 'easy', emoji: '😢' },
  { name: 'ANGRY', description: 'Claw hands at face', howTo: 'Claw shape at face, pull away tensely', category: 'emotions', difficulty: 'medium', emoji: '😠' },
  { name: 'LOVE', description: 'I Love You sign', howTo: 'Thumb, index, and pinky extended (ILY)', category: 'emotions', difficulty: 'easy', emoji: '❤️' },
  { name: 'SCARED', description: 'Hands shake in front of chest', howTo: 'Open hands, shake nervously', category: 'emotions', difficulty: 'medium', emoji: '😨' },

  // ALPHABET (A-Z)
  { name: 'A', description: 'Fist with thumb on side', howTo: 'Make a fist, thumb against side of fist', category: 'alphabet', difficulty: 'easy', emoji: '🅰️' },
  { name: 'B', description: 'Flat hand, thumb tucked in', howTo: 'Four fingers up straight, thumb tucked across palm', category: 'alphabet', difficulty: 'easy', emoji: '🅱️' },
  { name: 'C', description: 'Hand makes C shape', howTo: 'Curved hand like letter C', category: 'alphabet', difficulty: 'easy', emoji: '©️' },
  { name: 'D', description: 'Index up, others touching thumb', howTo: 'Index finger up, other fingers touch thumb (O shape)', category: 'alphabet', difficulty: 'medium', emoji: '📝' },
  { name: 'E', description: 'Fingers curled touching thumb', howTo: 'All fingers curled tightly, thumb over them', category: 'alphabet', difficulty: 'medium', emoji: '✊' },
  { name: 'F', description: 'Index and thumb touch, others up', howTo: 'OK sign with other three fingers up', category: 'alphabet', difficulty: 'easy', emoji: '👌' },
  { name: 'G', description: 'Index and thumb parallel (pinching)', howTo: 'Index and thumb pointing sideways', category: 'alphabet', difficulty: 'medium', emoji: '🤏' },
  { name: 'H', description: 'Index and middle finger sideways', howTo: 'Two fingers pointing horizontally', category: 'alphabet', difficulty: 'medium', emoji: '✌️' },
  { name: 'I', description: 'Pinky up', howTo: 'Only pinky finger extended', category: 'alphabet', difficulty: 'easy', emoji: 'ℹ️' },
  { name: 'J', description: 'Pinky draws a J', howTo: 'Pinky up, draw J shape in air', category: 'alphabet', difficulty: 'hard', emoji: '✍️' },
  { name: 'K', description: 'Victory sign with thumb between', howTo: 'Index and middle up, thumb between them', category: 'alphabet', difficulty: 'hard', emoji: '✌️' },
  { name: 'L', description: 'Make L shape', howTo: 'Index up, thumb out (L shape)', category: 'alphabet', difficulty: 'easy', emoji: '👌' },
  { name: 'M', description: 'Three fingers over thumb', howTo: 'Index, middle, ring over thumb', category: 'alphabet', difficulty: 'medium', emoji: 'Ⓜ️' },
  { name: 'N', description: 'Two fingers over thumb', howTo: 'Index and middle over thumb', category: 'alphabet', difficulty: 'medium', emoji: '✌️' },
  { name: 'O', description: 'Make O shape', howTo: 'All fingertips touch in O shape', category: 'alphabet', difficulty: 'easy', emoji: '⭕' },
  { name: 'P', description: 'Like K but pointing down', howTo: 'K handshape tilted downward', category: 'alphabet', difficulty: 'hard', emoji: '🅿️' },
  { name: 'Q', description: 'Like G but pointing down', howTo: 'G handshape pointing downward', category: 'alphabet', difficulty: 'hard', emoji: '❓' },
  { name: 'R', description: 'Fingers crossed', howTo: 'Index and middle crossed', category: 'alphabet', difficulty: 'medium', emoji: '🤞' },
  { name: 'S', description: 'Fist, thumb in front', howTo: 'Closed fist, thumb over fingers', category: 'alphabet', difficulty: 'easy', emoji: '✊' },
  { name: 'T', description: 'Thumb between index and middle', howTo: 'Thumb tucked between first two fingers', category: 'alphabet', difficulty: 'medium', emoji: '👍' },
  { name: 'U', description: 'Two fingers up together', howTo: 'Index and middle together, pointing up', category: 'alphabet', difficulty: 'easy', emoji: '✌️' },
  { name: 'V', description: 'Two fingers up apart (peace)', howTo: 'Index and middle spread in V shape', category: 'alphabet', difficulty: 'easy', emoji: '✌️' },
  { name: 'W', description: 'Three fingers up', howTo: 'Index, middle, ring extended', category: 'alphabet', difficulty: 'easy', emoji: '🤟' },
  { name: 'X', description: 'Index finger hooked', howTo: 'Index bent like hook (captain hook)', category: 'alphabet', difficulty: 'medium', emoji: '☝️' },
  { name: 'Y', description: 'Thumb and pinky out (hang loose)', howTo: 'Thumb and pinky extended, shaka sign', category: 'alphabet', difficulty: 'easy', emoji: '🤙' },
  { name: 'Z', description: 'Index finger draws Z in air', howTo: 'Index finger traces Z pattern', category: 'alphabet', difficulty: 'hard', emoji: '✍️' },
];

const ASLSigns = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const filteredSigns = aslSigns.filter(sign =>
    (activeTab === 'all' || sign.category === activeTab) &&
    (searchTerm === '' || 
      sign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sign.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'greetings': return <MessageCircle className="h-5 w-5" />;
      case 'questions': return <Search className="h-5 w-5" />;
      case 'people': return <Users className="h-5 w-5" />;
      case 'verbs': return <Zap className="h-5 w-5" />;
      case 'numbers': return <Hash className="h-5 w-5" />;
      case 'alphabet': return <Hand className="h-5 w-5" />;
      case 'emotions': return <Heart className="h-5 w-5" />;
      case 'time': return <Hash className="h-5 w-5" />;
      default: return <Hand className="h-5 w-5" />;
    }
  };

  const categoryStats = {
    all: aslSigns.length,
    greetings: aslSigns.filter(s => s.category === 'greetings').length,
    questions: aslSigns.filter(s => s.category === 'questions').length,
    people: aslSigns.filter(s => s.category === 'people').length,
    verbs: aslSigns.filter(s => s.category === 'verbs').length,
    numbers: aslSigns.filter(s => s.category === 'numbers').length,
    alphabet: aslSigns.filter(s => s.category === 'alphabet').length,
    emotions: aslSigns.filter(s => s.category === 'emotions').length,
    time: aslSigns.filter(s => s.category === 'time').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="border-slate-700 hover:border-cyan-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App
            </Button>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              ASL Signs Reference
            </h1>
            <p className="text-slate-400 text-xl">
              Complete guide to {aslSigns.length}+ American Sign Language signs
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search signs... (e.g., HELLO, THANKS, A, B)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700 focus:border-cyan-500 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex-wrap justify-center bg-slate-900/50 border border-slate-700/50 h-auto p-2 gap-2">
              <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500/20">
                All ({categoryStats.all})
              </TabsTrigger>
              <TabsTrigger value="greetings" className="data-[state=active]:bg-cyan-500/20">
                <MessageCircle className="mr-2 h-4 w-4" />
                Greetings ({categoryStats.greetings})
              </TabsTrigger>
              <TabsTrigger value="questions" className="data-[state=active]:bg-purple-500/20">
                <Search className="mr-2 h-4 w-4" />
                Questions ({categoryStats.questions})
              </TabsTrigger>
              <TabsTrigger value="people" className="data-[state=active]:bg-blue-500/20">
                <Users className="mr-2 h-4 w-4" />
                People ({categoryStats.people})
              </TabsTrigger>
              <TabsTrigger value="verbs" className="data-[state=active]:bg-green-500/20">
                <Zap className="mr-2 h-4 w-4" />
                Verbs ({categoryStats.verbs})
              </TabsTrigger>
              <TabsTrigger value="numbers" className="data-[state=active]:bg-yellow-500/20">
                <Hash className="mr-2 h-4 w-4" />
                Numbers ({categoryStats.numbers})
              </TabsTrigger>
              <TabsTrigger value="alphabet" className="data-[state=active]:bg-pink-500/20">
                <Hand className="mr-2 h-4 w-4" />
                Alphabet ({categoryStats.alphabet})
              </TabsTrigger>
              <TabsTrigger value="emotions" className="data-[state=active]:bg-red-500/20">
                <Heart className="mr-2 h-4 w-4" />
                Emotions ({categoryStats.emotions})
              </TabsTrigger>
              <TabsTrigger value="time" className="data-[state=active]:bg-indigo-500/20">
                Time ({categoryStats.time})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {/* Stats Bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-4 bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50"
              >
                <div className="text-center">
                  <p className="text-slate-400">
                    Showing <span className="text-cyan-400 font-bold">{filteredSigns.length}</span> signs
                    {searchTerm && <span> matching "<span className="text-purple-400">{searchTerm}</span>"</span>}
                  </p>
                </div>
              </motion.div>

              {/* Signs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSigns.map((sign, index) => (
                  <motion.div
                    key={sign.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="h-full bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-xl border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 group cursor-pointer overflow-hidden">
                      <div className="p-5 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {sign.emoji && (
                              <div className="text-4xl">{sign.emoji}</div>
                            )}
                            <div>
                              <h3 className="font-bold text-xl text-white group-hover:text-cyan-400 transition-colors">
                                {sign.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="text-slate-500 text-xs">
                                  {getCategoryIcon(sign.category)}
                                </div>
                                <Badge className={`text-xs ${getDifficultyColor(sign.difficulty)}`}>
                                  {sign.difficulty}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase">Description</p>
                            <p className="text-slate-300 text-sm mt-1">{sign.description}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase">How To</p>
                            <p className="text-cyan-300 text-sm mt-1">{sign.howTo}</p>
                          </div>
                        </div>

                        {/* Category Badge */}
                        <div className="pt-2 border-t border-slate-700/50">
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                            {sign.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* No Results */}
              {filteredSigns.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-white mb-2">No signs found</h3>
                  <p className="text-slate-400">
                    Try adjusting your search or selecting a different category
                  </p>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
        >
          <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 text-center">
            <div className="text-3xl font-bold text-cyan-400">{categoryStats.alphabet}</div>
            <div className="text-sm text-slate-400 mt-1">Alphabet Letters</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 text-center">
            <div className="text-3xl font-bold text-purple-400">{categoryStats.numbers}</div>
            <div className="text-sm text-slate-400 mt-1">Numbers</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 text-center">
            <div className="text-3xl font-bold text-green-400">{categoryStats.verbs}</div>
            <div className="text-sm text-slate-400 mt-1">Action Words</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 text-center">
            <div className="text-3xl font-bold text-yellow-400">{categoryStats.greetings}</div>
            <div className="text-sm text-slate-400 mt-1">Greetings</div>
          </Card>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-500 text-sm"
        >
          <p>💡 Tip: Click on any sign to see detailed instructions</p>
          <p className="mt-2">🤟 Total vocabulary: <span className="text-cyan-400 font-bold">{aslSigns.length}+ signs</span></p>
        </motion.div>
      </div>
    </div>
  );
};

export default ASLSigns;

