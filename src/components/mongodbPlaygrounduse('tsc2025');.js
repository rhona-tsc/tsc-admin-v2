use('tsc2025');

db.acts.updateOne(
    { _id: ObjectId("68540004e47bb51c79b9202e") },
  {
    $push: {
        selectedSongs: {
          $each: 
          [
            { "title": "Knock On Wood", "artist": "Amii Stewart", "year": 1979, "genre": "Disco" },
            { "title": "Copacabana", "artist": "Barry Manilow", "year": 1978, "genre": "Disco / Pop" },
            { "title": "Stayin' Alive", "artist": "Bee Gees", "year": 1977, "genre": "Disco" },
            { "title": "Candy", "artist": "Cameo", "year": 1986, "genre": "Funk / R&B" },
            { "title": "Everybody Dance", "artist": "Chic", "year": 1977, "genre": "Disco / Funk" },
            { "title": "Le Freak", "artist": "Chic", "year": 1978, "genre": "Disco / Funk" },
            { "title": "Groove Is In The Heart", "artist": "Deee-Lite", "year": 1990, "genre": "Dance / House" },
            { "title": "Fantasy", "artist": "Earth, Wind & Fire", "year": 1978, "genre": "Funk / R&B" },
            { "title": "Boogie Wonderland", "artist": "Earth, Wind & Fire", "year": 1979, "genre": "Disco / Funk" },
            { "title": "September", "artist": "Earth, Wind & Fire", "year": 1978, "genre": "Disco / Funk" },
            { "title": "Sexual Healing", "artist": "Hot 8 Brass Band", "year": 2018, "genre": "Brass Band / Funk" },
            { "title": "ABC", "artist": "Jackson 5", "year": 1970, "genre": "Soul / Pop" },
            { "title": "Get Up (Sex Machine)", "artist": "James Brown", "year": 1970, "genre": "Funk" },
            { "title": "I Got You (I Feel Good)", "artist": "James Brown", "year": 1965, "genre": "Funk / Soul" },
            { "title": "Cosmic Girl", "artist": "Jamiroquai", "year": 1996, "genre": "Acid Jazz / Funk" },
            { "title": "Chained To The Rhythm", "artist": "Katy Perry", "year": 2017, "genre": "Pop / Dance" },
            { "title": "Get Down Tonight", "artist": "KC & The Sunshine Band", "year": 1975, "genre": "Disco / Funk" },
            { "title": "Give It Up", "artist": "KC & The Sunshine Band", "year": 1983, "genre": "Pop / Funk" },
            { "title": "That's The Way I Like It", "artist": "KC & The Sunshine Band", "year": 1975, "genre": "Disco / Funk" },
            { "title": "Ladies Night", "artist": "Kool & The Gang", "year": 1979, "genre": "Funk / Disco" },
            { "title": "Celebration", "artist": "Kool & The Gang", "year": 1980, "genre": "Funk / Pop" },
            { "title": "Get Down on It", "artist": "Kool & The Gang", "year": 1981, "genre": "Funk / Disco" },
            { "title": "Fly Away", "artist": "Lenny Kravitz", "year": 1998, "genre": "Rock / Pop" },
            { "title": "Ain’t No Stopping Us Now", "artist": "McFadden & Whitehead", "year": 1979, "genre": "Disco / R&B" },
            { "title": "Don't Stop 'Til You Get Enough", "artist": "Michael Jackson", "year": 1979, "genre": "Disco / Funk" },
            { "title": "Wanna Be Startin' Somethin'", "artist": "Michael Jackson", "year": 1983, "genre": "Pop / Funk" },
            { "title": "Lady Marmalade", "artist": "Patti LaBelle", "year": 1974, "genre": "Funk / Soul" },
            { "title": "Superfreak", "artist": "Rick James", "year": 1981, "genre": "Funk" },
            { "title": "Car Wash", "artist": "Rose Royce", "year": 1976, "genre": "Funk / Disco" },
            { "title": "A Night To Remember", "artist": "Shalamar", "year": 1982, "genre": "Post‑Disco / R&B" },
            { "title": "Dance To The Music", "artist": "Sly & The Family Stone", "year": 1968, "genre": "Funk / Soul" },
            { "title": "Do I Do", "artist": "Stevie Wonder", "year": 1982, "genre": "Funk / R&B" },
            { "title": "Higher Ground", "artist": "Stevie Wonder", "year": 1973, "genre": "Funk / Soul" },
            { "title": "Brick House", "artist": "The Commodores", "year": 1977, "genre": "Funk / Soul" },
            { "title": "Blame It On The Boogie", "artist": "The Jacksons", "year": 1978, "genre": "Disco / Funk" },
            { "title": "Disco Inferno", "artist": "The Trammps", "year": 1976, "genre": "Disco" },
            { "title": "Y.M.C.A.", "artist": "Village People", "year": 1978, "genre": "Disco" },
            { "title": "Play That Funky Music", "artist": "Wild Cherry", "year": 1976, "genre": "Funk / Rock" }
            { "title": "Let’s Stay Together", "artist": "Al Green", "year": 1971, "genre": "Soul" },
            { "title": "(You Make Me Feel Like) A Natural Woman", "artist": "Aretha Franklin", "year": 1967, "genre": "Soul / R&B" },
            { "title": "Chain Of Fools", "artist": "Aretha Franklin", "year": 1967, "genre": "Soul" },
            { "title": "Respect", "artist": "Aretha Franklin", "year": 1967, "genre": "Soul" },
            { "title": "Rock Steady", "artist": "Aretha Franklin", "year": 1971, "genre": "Soul / Funk" },
            { "title": "Think", "artist": "Aretha Franklin", "year": 1968, "genre": "Soul" },
            { "title": "Dance With Me", "artist": "B.B. King", "year": 1990, "genre": "Blues / R&B" },
            { "title": "Ain’t No Sunshine", "artist": "Bill Withers", "year": 1971, "genre": "Soul / R&B" },
            { "title": "Lean On Me", "artist": "Bill Withers", "year": 1972, "genre": "Soul / R&B" },
            { "title": "Stand By Me", "artist": "Bill Withers", "year": 1971, "genre": "Soul / R&B" },
            { "title": "Ain’t Nobody", "artist": "Chaka Khan", "year": 1983, "genre": "R&B / Funk" },
            { "title": "I Feel For You", "artist": "Chaka Khan", "year": 1984, "genre": "R&B / Funk" },
            { "title": "You Got The Love", "artist": "Chaka Khan", "year": 1986, "genre": "R&B / Funk" },
            { "title": "Move On Up", "artist": "Curtis Mayfield", "year": 1970, "genre": "Soul / Funk" },
            { "title": "Glad All Over", "artist": "Dave Clark Five", "year": 1963, "genre": "Rock / Pop" },
            { "title": "Chain Reaction", "artist": "Diana Ross", "year": 1985, "genre": "Disco / R&B" },
            { "title": "Upside Down", "artist": "Diana Ross", "year": 1980, "genre": "Disco / R&B" },
            { "title": "Bad Girls", "artist": "Donna Summer", "year": 1979, "genre": "Disco" },
            { "title": "In The Stone", "artist": "Earth, Wind & Fire", "year": 1979, "genre": "Funk / Disco" },
            { "title": "At Last", "artist": "Etta James", "year": 1960, "genre": "Blues / Soul" },
            { "title": "I Just Wanna Make Love To You", "artist": "Etta James", "year": 1960, "genre": "Blues / Soul" },
            { "title": "Can’t Help Myself", "artist": "Four Tops", "year": 1965, "genre": "Motown / Soul" },
            { "title": "Can’t Take My Eyes Off You", "artist": "Frankie Valli", "year": 1967, "genre": "Pop / Soul" },
            { "title": "Give Me The Night", "artist": "George Benson", "year": 1980, "genre": "Jazz Funk / R&B" },
            { "title": "(Your Love Keeps Lifting Me) Higher And Higher", "artist": "Jackie Wilson", "year": 1967, "genre": "Soul" },
            { "title": "Somebody Else’s Guy", "artist": "Jocelyn Brown", "year": 1984, "genre": "R&B / Dance" },
            { "title": "My Destiny", "artist": "Lionel Richie", "year": 1992, "genre": "R&B / Pop" },
            { "title": "Good Golly Miss Molly", "artist": "Little Richard", "year": 1958, "genre": "Rock & Roll / R&B" },
            { "title": "Dance With My Father", "artist": "Luther Vandross", "year": 2003, "genre": "R&B / Soul" },
            { "title": "Never Too Much", "artist": "Luther Vandross", "year": 1981, "genre": "R&B / Soul" },
            { "title": "Dancing In The Street", "artist": "Martha & The Vandellas", "year": 1964, "genre": "Motown / Soul" },
            { "title": "I Heard It Through The Grapevine", "artist": "Marvin Gaye", "year": 1968, "genre": "Soul" },
            { "title": "Ain’t No Mountain High Enough", "artist": "Marvin Gaye & Tammi Terrell", "year": 1967, "genre": "Motown / Soul" },
            { "title": "(Sittin’ On) The Dock Of The Bay", "artist": "Otis Redding", "year": 1968, "genre": "Soul" },
            { "title": "Georgia On My Mind", "artist": "Ray Charles", "year": 1960, "genre": "Soul / Jazz" },
            { "title": "Hit The Road Jack", "artist": "Ray Charles", "year": 1961, "genre": "R&B / Soul" },
            { "title": "I Gotta Woman", "artist": "Ray Charles", "year": 1954, "genre": "R&B / Soul" },
            { "title": "Come And Get Your Love", "artist": "Redbone", "year": 1973, "genre": "Funk Rock / Native American Rock" },
            { "title": "Feel Like Makin' Love", "artist": "Roberta Flack", "year": 1974, "genre": "Soul / Jazz / R&B" },
            { "title": "Killing Me Softly (with His Song)", "artist": "Roberta Flack", "year": 1973, "genre": "Soul / R&B" },
            { "title": "A Change Is Gonna Come", "artist": "Sam Cooke", "year": 1964, "genre": "Soul / R&B" },
            { "title": "Bring It On Home To Me", "artist": "Sam Cooke", "year": 1962, "genre": "Soul / R&B" },
            { "title": "Cupid", "artist": "Sam Cooke", "year": 1961, "genre": "Soul / R&B" },
            { "title": "Everybody Is a Star", "artist": "Sly & The Family Stone", "year": 1970, "genre": "Funk / Soul" },
            { "title": "As", "artist": "Stevie Wonder", "year": 1976, "genre": "Soul / R&B" },
            { "title": "For Once in My Life", "artist": "Stevie Wonder", "year": 1968, "genre": "Soul / R&B" },
            { "title": "I Wish", "artist": "Stevie Wonder", "year": 1976, "genre": "Funk / Soul" },
            { "title": "Isn't She Lovely", "artist": "Stevie Wonder", "year": 1976, "genre": "Soul / R&B" },
            { "title": "Signed, Sealed, Delivered (I'm Yours)", "artist": "Stevie Wonder", "year": 1970, "genre": "Soul / Funk" },
            { "title": "Superstition", "artist": "Stevie Wonder", "year": 1972, "genre": "Funk / Soul" },
            { "title": "Easy", "artist": "The Commodores", "year": 1977, "genre": "Soul / R&B" },
            { "title": "Do You Love Me (Now That I Can Dance)", "artist": "The Contours", "year": 1962, "genre": "Soul / R&B" },
            { "title": "Best Of My Love", "artist": "The Emotions", "year": 1977, "genre": "Disco / R&B" },
            { "title": "Can You Feel It", "artist": "The Jackson 5", "year": 1980, "genre": "Funk / Disco" },
            { "title": "Jump", "artist": "The Pointer Sisters", "year": 1979, "genre": "Dance / R&B" },
            { "title": "You to Me Are Everything", "artist": "The Real Thing", "year": 1976, "genre": "Soul / Disco" },
            { "title": "Baby Love", "artist": "The Supremes", "year": 1964, "genre": "Motown / Soul" },
            { "title": "Can't Hurry Love", "artist": "The Supremes", "year": 1966, "genre": "Motown / Soul" },
            { "title": "For Once in My Life", "artist": "The Temptations", "year": 1968, "genre": "Soul / Motown" },
            { "title": "Get Ready", "artist": "The Temptations", "year": 1966, "genre": "Soul / Motown" },
            { "title": "My Girl", "artist": "The Temptations", "year": 1964, "genre": "Soul / Motown" },
            { "title": "Papa Was a Rollin' Stone", "artist": "The Temptations", "year": 1972, "genre": "Psychedelic Soul" },
            { "title": "Cloud Nine", "artist": "The Temptations", "year": 1969, "genre": "Psychedelic Soul" },
            { "title": "(Simply) The Best", "artist": "Tina Turner", "year": 1989, "genre": "Rock / Pop" },
            { "title": "All That She Wants", "artist": "Ace of Base", "year": 1993, "genre": "Pop / Reggae Fusion" },
  { "title": "Cold Shoulder", "artist": "Adele", "year": 2008, "genre": "Soul Pop" },
  { "title": "You Know I'm No Good", "artist": "Amy Winehouse", "year": 2007, "genre": "Contemporary R&B / Neo-Soul" },
  { "title": "2002", "artist": "Anne‑Marie", "year": 2018, "genre": "Pop" },
  { "title": "Everybody (Backstreet's Back)", "artist": "Backstreet Boys", "year": 1997, "genre": "Pop" },
  { "title": "Good Luck", "artist": "Basement Jaxx", "year": 2004, "genre": "Electronic / Dance" },
  { "title": "Barbie Girl", "artist": "Ben l'Oncle Soul", "year": 2009, "genre": "Soul / R&B" },
  { "title": "Work It Out", "artist": "Beyoncé", "year": 2002, "genre": "Funk / R&B" },
  { "title": "I Gotta Feeling", "artist": "Black Eyed Peas", "year": 2009, "genre": "Dance Pop / Hip Hop" },
  { "title": "Oops!... I Did It Again", "artist": "Britney Spears", "year": 2000, "genre": "Pop / Dance‑Pop" },
  { "title": "24K Magic", "artist": "Bruno Mars", "year": 2016, "genre": "Funk Pop / R&B" },
  { "title": "Billionaire", "artist": "Bruno Mars", "year": 2010, "genre": "Pop / Hip Hop" },
  { "title": "Count On Me", "artist": "Bruno Mars", "year": 2011, "genre": "Pop / R&B" },
  { "title": "Perm", "artist": "Bruno Mars", "year": 2016, "genre": "Funk / R&B" },
  { "title": "Runaway Baby", "artist": "Bruno Mars", "year": 2010, "genre": "Funk / Pop Rock" },
  { "title": "Treasure", "artist": "Bruno Mars", "year": 2013, "genre": "Funk Pop" },
  { "title": "Giant", "artist": "Calvin Harris & Rag'n'Bone Man", "year": 2019, "genre": "Dance Pop" },
  { "title": "Feels", "artist": "Calvin Harris feat. Katy Perry, Pharrell Williams & Big Sean", "year": 2017, "genre": "Funk / Dance Pop" },
  { "title": "Havana (No Rap Version)", "artist": "Camila Cabello", "year": 2017, "genre": "Latin Pop" },
  { "title": "Girls Like You", "artist": "Cardi B & Maroon 5", "year": 2018, "genre": "Pop Rap" },
  { "title": "Call Me Maybe", "artist": "Carly Rae Jepsen", "year": 2011, "genre": "Pop" },
  { "title": "Forget You", "artist": "Cee Lo Green", "year": 2010, "genre": "Soul Pop" },
  { "title": "Attention", "artist": "Charlie Puth", "year": 2017, "genre": "Pop" },
  { "title": "A Thousand Years", "artist": "Christina Perri", "year": 2011, "genre": "Pop Ballad" },
  { "title": "Bubbly", "artist": "Colbie Caillat", "year": 2007, "genre": "Acoustic Pop" },
  { "title": "Fix You", "artist": "Coldplay", "year": 2005, "genre": "Alternative Rock" },
  { "title": "Green Eyes", "artist": "Coldplay", "year": 2002, "genre": "Alternative Rock" },
  { "title": "Girls Just Wanna Have Fun", "artist": "Cyndi Lauper", "year": 1983, "genre": "Pop" },
  { "title": "Get Lucky", "artist": "Daft Punk ft. Pharrell Williams,", "year": 2013, "genre": "Disco / Funk" },
  { "title": "Gotta Get Through This", "artist": "Daniel Beddingfield", "year": 2001, "genre": "Pop / R&B" },
  { "title": "Jumpin'", "artist": "Destiny's Child", "year": 2000, "genre": "Contemporary R&B" },
  { "title": "Blow Your Mind (Mwah)", "artist": "Dua Lipa", "year": 2016, "genre": "Electropop" },
  { "title": "Don't Start Now", "artist": "Dua Lipa", "year": 2019, "genre": "Disco Pop" },
  { "title": "Mercy", "artist": "Duffy", "year": 2008, "genre": "Soul / Pop" },
  { "title": "Warwick Avenue", "artist": "Duffy", "year": 2008, "genre": "Soul / Pop" },
  { "title": "A-Team", "artist": "Ed Sheeran", "year": 2011, "genre": "Folk Pop" },
  { "title": "Castle on the Hill", "artist": "Ed Sheeran", "year": 2017, "genre": "Pop" },
  { "title": "Don’t", "artist": "Ed Sheeran", "year": 2014, "genre": "Pop" },
  { "title": "Galway Girl", "artist": "Ed Sheeran", "year": 2017, "genre": "Folk pop" },
  { "title": "Sing", "artist": "Ed Sheeran feat. Pharrell Williams", "year": 2014, "genre": "Pop / Funk" },
  { "title": "Dream a Little Dream of Me", "artist": "Ella Fitzgerald", "year": 1950, "genre": "Jazz / Traditional pop" },
  { "title": "Ghost", "artist": "Ella Henderson", "year": 2014, "genre": "Pop / Soul" },
  { "title": "Figure 8", "artist": "Ellie Goulding", "year": 2012, "genre": "Electropop" },
  { "title": "Clown", "artist": "Emeli Sandé", "year": 2012, "genre": "Soul / R&B" },
  { "title": "Sweet Dreams (Are Made of This)", "artist": "Eurythmics", "year": 1983, "genre": "Synthpop / New Wave" },
  { "title": "Sax", "artist": "Fleur East", "year": 2015, "genre": "R&B / Funk / Dance-pop" },
  { "title": "Freedom! ’90", "artist": "George Michael", "year": 1990, "genre": "Pop / Dance-pop" },
  { "title": "Budapest", "artist": "George Ezra", "year": 2014, "genre": "Folk rock / Pop" },
  { "title": "Crazy", "artist": "Gnarls Barkley", "year": 2006, "genre": "Soul / Neo-soul" },
  { "title": "Superstar", "artist": "Jamelia", "year": 2003, "genre": "R&B / Pop" },
  { "title": "Bonfire Heart", "artist": "James Blunt", "year": 2013, "genre": "Pop rock / Soft rock" },
  { "title": "Broken Strings", "artist": "James Morrison", "year": 2008, "genre": "Pop rock / Soul" },
  { "title": "Do It Like a Dude", "artist": "Jessie J", "year": 2010, "genre": "R&B / Pop" },
  { "title": "Domino", "artist": "Jessie J", "year": 2011, "genre": "Pop / R&B" },
  { "title": "Bang Bang", "artist": "Jessie J ft. Ariana Grande & Nicki Minaj", "year": 2014, "genre": "Pop / R&B" },
  { "title": "All of Me", "artist": "John Legend", "year": 2013, "genre": "R&B / Soul" },
  { "title": "Ordinary People", "artist": "John Legend", "year": 2005, "genre": "R&B / Soul" },
  { "title": "Can’t Stop the Feeling!", "artist": "Justin Timberlake", "year": 2016, "genre": "Dance-pop" },
  { "title": "California Gurls", "artist": "Katy Perry", "year": 2010, "genre": "Pop" },
  { "title": "I Kissed a Girl", "artist": "Katy Perry", "year": 2008, "genre": "Pop rock" },
  { "title": "Poker Face", "artist": "Lady Gaga", "year": 2008, "genre": "Electropop / Dance-pop" },
  { "title": "Blue Jeans", "artist": "Lana Del Rey", "year": 2012, "genre": "Baroque pop / Indie pop" },
  { "title": "Black Magic", "artist": "Little Mix", "year": 2015, "genre": "Pop" },
  { "title": "About Damn Time", "artist": "Lizzo", "year": 2022, "genre": "Funk-pop / Disco" },
  { "title": "Good as Hell", "artist": "Lizzo", "year": 2016, "genre": "Pop / R&B" },
  { "title": "Juice", "artist": "Lizzo", "year": 2019, "genre": "Funk / Pop" },
  { "title": "Express Yourself", "artist": "Madonna", "year": 1989, "genre": "Pop / Dance-pop" },
  { "title": "La Isla Bonita", "artist": "Madonna", "year": 1987, "genre": "Latin pop" },
  { "title": "Vogue", "artist": "Madonna", "year": 1990, "genre": "Dance-pop" },
  { "title": "Does Your Mother Know", "artist": "ABBA", "year": 1979, "genre": "Disco / Pop" },
  { "title": "Sunday Morning", "artist": "Maroon 5", "year": 2004, "genre": "Pop rock" },
  {
    "title": "Don't Stop The Music",
    "artist": "Rihanna",
    "year": 2007,
    "genre": "Dance-pop / Club"
  },
  {
    "title": "Work",
    "artist": "Rihanna",
    "year": 2016,
    "genre": "Dancehall / R&B"
  },
  {
    "title": "FourFiveSeconds",
    "artist": "Rihanna, Kanye West, Paul McCartney",
    "year": 2015,
    "genre": "Pop / Folk-pop"
  },
  {
    "title": "Angels",
    "artist": "Robbie Williams",
    "year": 1997,
    "genre": "Pop rock / Ballad"
  },
  {
    "title": "Let Me Entertain You",
    "artist": "Robbie Williams",
    "year": 1998,
    "genre": "Rock / Pop"
  },
  {
    "title": "Blurred Lines",
    "artist": "Robin Thicke ft Pharrell Williams",
    "year": 2013,
    "genre": "R&B / Funk-pop"
  },
  {
    "title": "Bring It All Back",
    "artist": "S Club 7",
    "year": 1999,
    "genre": "Pop"
  },
  {
    "title": "Don't Stop Movin'",
    "artist": "S Club 7",
    "year": 2001,
    "genre": "Dance-pop"
  },
  {
    "title": "Black & Gold",
    "artist": "Sam Sparro",
    "year": 2008,
    "genre": "Electropop / Funk"
  },
  {
    "title": "Maria Maria",
    "artist": "Santana",
    "year": 1999,
    "genre": "Latin rock / R&B"
  },
  {
    "title": "Oye Como Va",
    "artist": "Santana",
    "year": 1971,
    "genre": "Latin rock"
  },
  {
    "title": "I Don't Feel Like Dancin'",
    "artist": "Scissor Sisters",
    "year": 2006,
    "genre": "Disco / Pop rock"
  },
  {
    "title": "Waka Waka (This Time for Africa)",
    "artist": "Shakira",
    "year": 2010,
    "genre": "Afro-fusion / Pop"
  },
  {
    "title": "Whenever, Wherever",
    "artist": "Shakira",
    "year": 2001,
    "genre": "Latin pop / Worldbeat"
  },
  {
    "title": "Man! I Feel Like A Woman!",
    "artist": "Shania Twain",
    "year": 1999,
    "genre": "Country pop"
  },
  {
    "title": "That Don't Impress Me Much",
    "artist": "Shania Twain",
    "year": 1998,
    "genre": "Country pop / Pop rock"
  },
  {
    "title": "Chandelier",
    "artist": "Sia",
    "year": 2014,
    "genre": "Electropop / Power pop"
  },
    {
      "title": "This Love",
      "artist": "Maroon 5",
      "year": 2004,
      "genre": "Pop rock / Funk rock"
    },
    {
      "title": "All About You",
      "artist": "McFly",
      "year": 2005,
      "genre": "Pop rock"
    },
    {
      "title": "All About That Bass",
      "artist": "Meghan Trainor",
      "year": 2014,
      "genre": "Bubblegum pop / Doo-wop / Pop"
    },
    {
      "title": "Fever",
      "artist": "Michael Bublé",
      "year": 2003,
      "genre": "Jazz pop / Swing"
    },
    {
      "title": "Man In The Mirror",
      "artist": "Michael Jackson",
      "year": 1988,
      "genre": "Pop / Soul"
    },
    {
      "title": "Don't Know Why",
      "artist": "Norah Jones",
      "year": 2002,
      "genre": "Jazz / Pop"
    },
    {
      "title": "Good 4 U",
      "artist": "Olivia Rodrigo",
      "year": 2021,
      "genre": "Pop punk / Rock"
    },
    {
      "title": "Dance With Me Tonight",
      "artist": "Olly Murs",
      "year": 2011,
      "genre": "Pop / Soul"
    },
    {
      "title": "Cheerleader",
      "artist": "OMI",
      "year": 2012,
      "genre": "Reggae fusion / Pop"
    },
    {
      "title": "Get The Party Started",
      "artist": "P!nk",
      "year": 2001,
      "genre": "Dance-pop / R&B"
    },
    {
      "title": "New Shoes",
      "artist": "Paolo Nutini",
      "year": 2007,
      "genre": "Pop rock / Soul"
    },
    {
      "title": "Livin' La Vida Loca",
      "artist": "Ricky Martin",
      "year": 1999,
      "genre": "Latin pop / Dance-pop"
    },
    {
      "title": "California King Bed",
      "artist": "Rihanna",
      "year": 2011,
      "genre": "Pop / R&B"
    },
    {
      "title": "Diamonds",
      "artist": "Rihanna",
      "year": 2012,
      "genre": "Pop / Electronic / R&B"
    },
    {
        "title": "Cheap Thrills",
        "artist": "Sia",
        "year": 2016,
        "genre": "Electropop / Dancehall"
      },
      {
        "title": "Diamonds",
        "artist": "Sia",
        "year": 2021,
        "genre": "Pop / Electropop"
      },
      {
        "title": "Came Here For Love",
        "artist": "Sigala ft Ella Eyre",
        "year": 2017,
        "genre": "Dance / House"
      },
      {
        "title": "About You Now",
        "artist": "Sugababes",
        "year": 2007,
        "genre": "Pop rock / Electropop"
      },
      {
        "title": "Flowers",
        "artist": "Sweet Female Attitude",
        "year": 2000,
        "genre": "UK Garage"
      },
      {
        "title": "Back For Good",
        "artist": "Take That",
        "year": 1995,
        "genre": "Pop / Soft rock"
      },
      {
        "title": "Relight My Fire",
        "artist": "Take That",
        "year": 1993,
        "genre": "Pop / Disco"
      },
      {
        "title": "Blank Space",
        "artist": "Taylor Swift",
        "year": 2014,
        "genre": "Synth-pop / Electropop"
      },
      {
        "title": "Closer",
        "artist": "The Chainsmokers feat. Halsey",
        "year": 2016,
        "genre": "EDM / Electropop"
      },
      {
        "title": "Breakeven",
        "artist": "The Script",
        "year": 2008,
        "genre": "Pop rock"
      },
      {
        "title": "Blinding Lights",
        "artist": "The Weeknd",
        "year": 2019,
        "genre": "Synthwave / Pop"
      },
      {
        "title": "Can't Feel My Face",
        "artist": "The Weeknd",
        "year": 2015,
        "genre": "Pop / Funk"
      },
      {
        "title": "1000 Miles",
        "artist": "Vanessa Carlton",
        "year": 2002,
        "genre": "Pop / Piano rock"
      },
      {
        "title": "A Nightingale Sang In Berkeley Square",
        "artist": "Vera Lynn",
        "year": 1940,
        "genre": "Traditional pop / Vocal jazz"
      },
      {
        "title": "Eyes Shut",
        "artist": "Years & Years",
        "year": 2015,
        "genre": "Synth-pop"
      },
      {
        "title": "Dancing Queen",
        "artist": "ABBA",
        "year": 1976,
        "genre": "Disco / Pop"
      },
      {
        "title": "Gimme! Gimme! Gimme! (A Man After Midnight)",
        "artist": "ABBA",
        "year": 1979,
        "genre": "Disco / Pop"
      },
      {
        "title": "Evergreen (Love Theme from A Star Is Born)",
        "artist": "Barbra Streisand",
        "year": 1976,
        "genre": "Pop / Ballad"
      },
      {
        "title": "Baby I Love Your Way",
        "artist": "Big Mountain",
        "year": 1994,
        "genre": "Reggae / Pop"
      },
      {
        "title": "Uptown Girl",
        "artist": "Billy Joel",
        "year": 1983,
        "genre": "Pop / Rock"
      },
      {
        "title": "Big Yellow Taxi",
        "artist": "Joni Mitchell",
        "year": 1970,
        "genre": "Folk / Pop"
      },
      {
        "title": "Daddy Cool",
        "artist": "Boney M",
        "year": 1976,
        "genre": "Disco / Euro Pop"
      },
      {
        "title": "Sunny",
        "artist": "Boney M",
        "year": 1976,
        "genre": "Disco / Funk"
      },
      {
        "title": "Let's Dance",
        "artist": "David Bowie",
        "year": 1983,
        "genre": "Pop / Rock"
      },
      {
        "title": "Change the World",
        "artist": "Eric Clapton",
        "year": 1996,
        "genre": "Soft Rock / Pop"
      },
      {
        "title": "Don't Stop",
        "artist": "Fleetwood Mac",
        "year": 1977,
        "genre": "Rock / Pop"
      },
      {
        "title": "Dreams",
        "artist": "Fleetwood Mac",
        "year": 1977,
        "genre": "Soft Rock"
      },
      {
        "title": "Faith",
        "artist": "George Michael",
        "year": 1987,
        "genre": "Pop / Rock"
      },
      {
        "title": "Conga",
        "artist": "Gloria Estefan and Miami Sound Machine",
        "year": 1985,
        "genre": "Latin Pop / Dance"
      },
      {
        "title": "Dr. Beat",
        "artist": "Gloria Estefan and Miami Sound Machine",
        "year": 1984,
        "genre": "Dance / Pop"
      },
      {
        "title": "Rhythm Is Gonna Get You",
        "artist": "Gloria Estefan and Miami Sound Machine",
        "year": 1987,
        "genre": "Latin Pop / Dance"
      },
      {
        "title": "Don't Stop Believin'",
        "artist": "Journey",
        "year": 1981,
        "genre": "Rock"
      },
      {
        "title": "Move Your Feet",
        "artist": "Junior Senior",
        "year": 2002,
        "genre": "Dance / Pop"
      },
      {
        "title": "All Night Long (All Night)",
        "artist": "Lionel Richie",
        "year": 1983,
        "genre": "Pop / R&B"
      },
      {
        "title": "Dancing on the Ceiling",
        "artist": "Lionel Richie",
        "year": 1986,
        "genre": "Pop / R&B"
      },
      {
        "title": "Easy",
        "artist": "Lionel Richie (with Commodores)",
        "year": 1977,
        "genre": "Soul / R&B"
      },
      {
        "title": "Beat It",
        "artist": "Michael Jackson",
        "year": 1983,
        "genre": "Rock / Pop"
      },
      {
        "title": "Billie Jean",
        "artist": "Michael Jackson",
        "year": 1983,
        "genre": "Pop / R&B"
      },
      {
        "title": "Black or White",
        "artist": "Michael Jackson",
        "year": 1991,
        "genre": "Pop / Rock"
      },
      {
        "title": "Rock with You",
        "artist": "Michael Jackson",
        "year": 1979,
        "genre": "Disco / R&B"
      },
      {
        "title": "1999",
        "artist": "Prince",
        "year": 1982,
        "genre": "Pop / Funk"
      },
      {
        "title": "Kiss",
        "artist": "Prince",
        "year": 1986,
        "genre": "Funk / Pop"
      },
      {
        "title": "Purple Rain",
        "artist": "Prince",
        "year": 1984,
        "genre": "Rock / Pop"
      },
      {
        "title": "Englishman In New York",
        "artist": "Sting",
        "year": 1987,
        "genre": "Pop / Jazz"
      },
      {
        "title": "Bei Mir Bist Du Schön",
        "artist": "The Andrews Sisters",
        "year": 1937,
        "genre": "Swing / Vocal Jazz"
      },
      {
        "title": "(They Long to Be) Close to You",
        "artist": "The Carpenters",
        "year": 1970,
        "genre": "Soft Rock / Pop"
      },
      {
        "title": "Goodbye to Love",
        "artist": "The Carpenters",
        "year": 1972,
        "genre": "Soft Rock / Pop"
      },
      {
        "title": "Shake Your Body (Down to the Ground)",
        "artist": "The Jacksons",
        "year": 1978,
        "genre": "Disco / Funk"
      },
      {
        "title": "Every Breath You Take",
        "artist": "The Police",
        "year": 1983,
        "genre": "Rock / New Wave"
      },
      {
        "title": "Every Little Thing She Does Is Magic",
        "artist": "The Police",
        "year": 1981,
        "genre": "New Wave / Pop Rock"
      },
      {
        "title": "It's Raining Men",
        "artist": "The Weather Girls",
        "year": 1982,
        "genre": "Disco / Hi-NRG"
      },
      {
        "title": "Wake Me Up Before You Go-Go",
        "artist": "Wham!",
        "year": 1984,
        "genre": "Pop"
      },
      {
        "title": "I'm Outta Love",
        "artist": "Anastacia",
        "year": 2000,
        "genre": "Pop / Dance"
      },
      {
        "title": "Not That Kind",
        "artist": "Anastacia",
        "year": 2000,
        "genre": "Pop / Funk"
      },
      {
        "title": "Toxic",
        "artist": "Britney Spears",
        "year": 2003,
        "genre": "Electropop"
      },
      {
        "title": "That Man",
        "artist": "Caro Emerald",
        "year": 2010,
        "genre": "Jazz Pop / Retro Swing"
      },
      {
        "title": "Call My Name",
        "artist": "Cheryl",
        "year": 2012,
        "genre": "Dance Pop"
      },
      {
        "title": "Dance, Dance, Dance (Yowsah, Yowsah, Yowsah)",
        "artist": "Chic",
        "year": 1977,
        "genre": "Disco / Funk"
      },
      {
        "title": "Cake by the Ocean",
        "artist": "DNCE",
        "year": 2015,
        "genre": "Dance Rock / Pop"
      },
      {
        "title": "Hot Stuff",
        "artist": "Donna Summer",
        "year": 1979,
        "genre": "Disco / Rock"
      },
    
        { "title": "Be The One", "artist": "Dua Lipa", "year": 2015, "genre": "Dream pop / Europop / Synth-pop" },
        { "title": "Answerphone", "artist": "Banx & Ranx feat. Ella Eyre", "year": 2018, "genre": "Electro / Dancehall / House" },
        { "title": "Cherry Wine", "artist": "Hozier", "year": 2016, "genre": "Folk / Indie folk" },
        {
            "title": "On the Floor",
            "artist": "Jennifer Lopez ft. Pitbull",
            "year": 2011,
            "genre": "Dance‑pop / Electro / House"
          },
          {
            "title": "Breathe",
            "artist": "Jax Jones ft. Ina Wroldsen",
            "year": 2017,
            "genre": "Deep House"
          },
          {
            "title": "Commander",
            "artist": "Kelly Rowland ft. David Guetta",
            "year": 2010,
            "genre": "Electro House / R&B"
          },
          {
            "title": "Firestone",
            "artist": "Kygo ft. Conrad Sewell",
            "year": 2014,
            "genre": "Tropical House"
          },
          {
            "title": "A Little Respect",
            "artist": "Erasure",
            "year": 1988,
            "genre": "Synth‑pop / Electronic"
          },
          {
            "title": "Just Dance",
            "artist": "Lady Gaga",
            "year": 2008,
            "genre": "Dance‑pop / Electropop"
          },
          {
            "title": "Telephone",
            "artist": "Lady Gaga ft. Beyoncé",
            "year": 2010,
            "genre": "Electronic / Pop / Dance‑pop"
          },
          {
            "title": "Mambo No. 5 (A Little Bit Of...)",
            "artist": "Lou Bega",
            "year": 1999,
            "genre": "Latin Pop / Jazz Pop"
          },
          {
            "title": "Burn This Disco Out",
            "artist": "Michael Jackson",
            "year": 1979,
            "genre": "Disco / Funk / R&B"
          },
          {
            "title": "Changing",
            "artist": "Sigma ft. Paloma Faith",
            "year": 2014,
            "genre": "Electronic / Drum & Bass"
          },
          {
            "title": "Don't Stop the Music",
            "artist": "Rihanna",
            "year": 2007,
            "genre": "Dance‑pop / Electronic"
          },
          {
            "title": "Rude Boy",
            "artist": "Rihanna",
            "year": 2010,
            "genre": "Pop / R&B"
          },
          { "title": "Fallin'", "artist": "Alicia Keys", "year": 2001, "genre": "Neo Soul / R&B" },
  { "title": "1 Thing", "artist": "Amerie", "year": 2005, "genre": "Contemporary R&B / Funk" },
  { "title": "Back to Black", "artist": "Amy Winehouse", "year": 2007, "genre": "Soul" },
  { "title": "Crazy in Love", "artist": "Beyoncé feat. Jay‑Z", "year": 2003, "genre": "Contemporary R&B / Funk" },
  { "title": "No Diggity", "artist": "Blackstreet feat. Dr. Dre & Queen Pen", "year": 1996, "genre": "New Jack Swing / R&B" },
  { "title": "Cupid", "artist": "Amy Winehouse", "year": 2003, "genre": "Soul / R&B" },
  { "title": "Rehab", "artist": "Amy Winehouse", "year": 2006, "genre": "Soul / Pop" },
  { "title": "Wish I Didn’t Miss You Anymore", "artist": "Angie Stone", "year": 2002, "genre": "Neo Soul / R&B" },
  { "title": "End Of Time", "artist": "Beyoncé", "year": 2011, "genre": "Pop / R&B" },
  { "title": "Deja Vu", "artist": "Beyoncé ft. Jay-Z", "year": 2006, "genre": "Funk / R&B" },
  { "title": "Bills, Bills, Bills", "artist": "Destiny's Child", "year": 1999, "genre": "R&B" },
  { "title": "Bootylicious", "artist": "Destiny's Child", "year": 2001, "genre": "Pop / R&B" },
  { "title": "Lose My Breath", "artist": "Destiny's Child", "year": 2004, "genre": "R&B / Dance" },
  { "title": "Don't Let Go (Love)", "artist": "En Vogue", "year": 1996, "genre": "R&B / Soul" },
  { "title": "Afro Blue", "artist": "Erykah Badu", "year": 2003, "genre": "Jazz / Neo Soul" },
  { "title": "Love Like This", "artist": "Faith Evans", "year": 1998, "genre": "R&B" },
  { "title": "Pony", "artist": "Ginuwine", "year": 1996, "genre": "R&B / Hip Hop Soul" },
  {
    "title": "Hotline Bling",
    "artist": "Drake",
    "year": 2015,
    "genre": "Pop / R&B"
  },
  {
    "title": "Electric Lady",
    "artist": "Janelle Monáe",
    "year": 2014,
    "genre": "R&B / Funk / Neo Soul"
  },
  {
    "title": "Control",
    "artist": "Janet Jackson",
    "year": 1986,
    "genre": "Contemporary R&B / Funk"
  },
  {
    "title": "Cry Me a River",
    "artist": "Justin Timberlake",
    "year": 2002,
    "genre": "Pop / R&B"
  },
  {
    "title": "Gold Digger",
    "artist": "Kanye West ft. Jamie Foxx",
    "year": 2005,
    "genre": "Hip Hop"
  },
  {
    "title": "Trick Me",
    "artist": "Kelis",
    "year": 2004,
    "genre": "Funk / Reggae / Ska"
  },
  { "title": "Aïcha", "artist": "Khaled", "year": 1996, "genre": "Raï / World" },
  { "title": "Beggin’", "artist": "Madcon", "year": 2007, "genre": "Electropop / Dance-pop" },
  { "title": "Awakening", "artist": "Zak Abel", "year": 2017, "genre": "Pop / R&B" },
  {
    "title": "Don't Mess With My Man",
    "artist": "Lucy Pearl",
    "year": 2000,
    "genre": "R&B / Soul"
  },
  {
    "title": "Always Be My Baby",
    "artist": "Mariah Carey",
    "year": 1996,
    "genre": "Pop / R&B Ballad"
  },
  {
    "title": "Good Love",
    "artist": "Mary J. Blige",
    "year": 2009,
    "genre": "R&B / Hip‑Hop Soul"
  },
  { "title": "Man Down", "artist": "Rihanna", "year": 2011, "genre": "Reggae fusion / Dancehall / R&B" },
  { "title": "SOS", "artist": "Rihanna", "year": 2006, "genre": "Dance-pop / R&B" },
  { "title": "Umbrella", "artist": "Rihanna", "year": 2007, "genre": "Synth-pop / R&B" },
  { "title": "Back to Life (However Do You Want Me)", "artist": "Soul II Soul feat. Caron Wheeler", "year": 1989, "genre": "R&B / Proto-jungle / House" },
  { "title": "No Scrubs", "artist": "TLC", "year": 1999, "genre": "Contemporary R&B / Hip-hop soul" },
  { "title": "Un‑Break My Heart", "artist": "Toni Braxton", "year": 1996, "genre": "R&B / Pop ballad" },
  { "title": "What Is Hip?", "artist": "Tower Of Power", "year": 1973, "genre": "Funk / Soul" },
  { "title": "Awakening", "artist": "Zak Abel", "year": 2017, "genre": "Pop / R&B" },
  { "title": "Empire State of Mind", "artist": "Jay‑Z feat. Alicia Keys", "year": 2009, "genre": "Hip Hop / R&B" },
  { "title": "American Boy", "artist": "Estelle feat. Kanye West", "year": 2008, "genre": "R&B / Pop" },
  { "title": "Let Me Blow Ya Mind", "artist": "Eve feat. Gwen Stefani", "year": 2001, "genre": "Hip Hop / R&B" },
  { "title": "Rock Your Body", "artist": "Justin Timberlake", "year": 2003, "genre": "Disco / R&B" },
  { "title": "Doo Wop (That Thing)", "artist": "Lauryn Hill", "year": 1998, "genre": "Doo-wop / Hip Hop / R&B" },
  { "title": "Ex‑Factor", "artist": "Lauryn Hill", "year": 1998, "genre": "R&B / Neo Soul / Hip Hop Soul" },
  { "title": "Hey Ya!", "artist": "OutKast", "year": 2003, "genre": "Pop / Electro / Funk / Neo‑Soul" },
  { "title": "A Sky Full of Stars", "artist": "Coldplay", "year": 2014, "genre": "EDM / Pop" },
  { "title": "Blower’s Daughter", "artist": "Damien Rice", "year": 2001, "genre": "Folk Rock" },
  { "title": "Delicate", "artist": "Damien Rice", "year": 2002, "genre": "Folk Rock" },
  { "title": "Bohemian Like You", "artist": "The Dandy Warhols", "year": 2000, "genre": "Alternative Rock" },
  { "title": "Don't Stop", "artist": "Fleetwood Mac", "year": 1977, "genre": "Pop Rock" },
  { "title": "Feel Good Inc.", "artist": "Gorillaz", "year": 2005, "genre": "Alternative Rock / Hip Hop" },
  { "title": "1973", "artist": "James Blunt", "year": 2007, "genre": "Pop Rock" },
  { "title": "Across The Universe", "artist": "The Beatles", "year": 1969, "genre": "Rock / Psychedelic" },
  { "title": "All The Pretty Girls", "artist": "Kaleo", "year": 2016, "genre": "Indie Folk / Rock" },
  { "title": "C'est la Vie", "artist": "Khaled", "year": 1997, "genre": "Raï / World Music" },
  { "title": "Acquiesce", "artist": "Oasis", "year": 1995, "genre": "Britpop / Rock" },
  { "title": "Cast No Shadow", "artist": "Oasis", "year": 1995, "genre": "Britpop / Rock" },
  { "title": "Cigarettes & Alcohol", "artist": "Oasis", "year": 1994, "genre": "Britpop / Rock" },
  { "title": "Don't Look Back In Anger", "artist": "Oasis", "year": 1996, "genre": "Britpop / Rock" },
  {
    "title": "Better Man",
    "artist": "Pearl Jam",
    "year": 1994,
    "genre": "Alternative rock / grunge / pop rock"
  },
  {
    "title": "Chocolate",
    "artist": "The 1975",
    "year": 2013,
    "genre": "Pop rock / alternative rock / funk"
  },
  {
    "title": "America",
    "artist": "Razorlight",
    "year": 2006,
    "genre": "Indie rock / alternative rock"
  },
  {
    "title": "Dani California",
    "artist": "Red Hot Chili Peppers",
    "year": 2006,
    "genre": "Alternative rock / funk rock"
  },
  {
    "title": "Give It Away",
    "artist": "Red Hot Chili Peppers",
    "year": 1991,
    "genre": "Funk rock / alternative rock"
  },
  {
    "title": "1979",
    "artist": "Smashing Pumpkins",
    "year": 1996,
    "genre": "Alternative rock / dream pop"
  },
  {
    "title": "Chasing Cars",
    "artist": "Snow Patrol",
    "year": 2006,
    "genre": "Alternative rock / soft rock"
  },
  {
    "title": "2 Of Us",
    "artist": "The Beatles",
    "year": 1970,
    "genre": "Folk rock / soft rock"
  },
  {
    "title": "Can't Pretend",
    "artist": "Tom Odell",
    "year": 2013,
    "genre": "Indie pop / alternative"
  },
  {
    "title": "Concrete",
    "artist": "Tom Odell",
    "year": 2018,
    "genre": "Indie pop / singer-songwriter"
  },
  {
    "title": "Desire",
    "artist": "U2",
    "year": 1988,
    "genre": "Rock / garage rock"
  },
  {
    "title": "Can't Do Without You",
    "artist": "Caribou",
    "year": 2014,
    "genre": "Electronic / dream pop"
  },
  {
    "title": "Best of You",
    "artist": "Foo Fighters",
    "year": 2005,
    "genre": "Alternative rock / post-grunge"
  },
  {
    "title": "Can’t Stand Me Now",
    "artist": "The Libertines",
    "year": 2004,
    "genre": "Indie rock / garage rock revival"
  },
  {
    "title": "Don’t Want To Miss A Thing",
    "artist": "Aerosmith",
    "year": 1998,
    "genre": "Rock / Power Ballad"
  },
  {
    "title": "Complicated",
    "artist": "Avril Lavigne",
    "year": 2002,
    "genre": "Pop rock / Teen pop"
  },
  {
    "title": "Always",
    "artist": "Bon Jovi",
    "year": 1994,
    "genre": "Rock / Power Ballad"
  },
  {
    "title": "Bed Of Roses",
    "artist": "Bon Jovi",
    "year": 1992,
    "genre": "Rock / Ballad"
  },
  {
    "title": "Pour Some Sugar on Me",
    "artist": "Def Leppard",
    "year": 1987,
    "genre": "Glam metal / Hard rock"
  },
  {
    "title": "Candle In The Wind",
    "artist": "Elton John",
    "year": 1973,
    "genre": "Soft rock / Ballad"
  },
  {
    "title": "Cocaine",
    "artist": "Eric Clapton",
    "year": 1977,
    "genre": "Blues rock / Classic rock"
  },
  {
    "title": "All Right Now",
    "artist": "Free",
    "year": 1970,
    "genre": "Hard rock / Blues rock"
  },
  {
    "title": "Basket Case",
    "artist": "Green Day",
    "year": 1994,
    "genre": "Punk rock / Alternative rock"
  },
  {
    "title": "Are You Gonna Be My Girl",
    "artist": "Jet",
    "year": 2003,
    "genre": "Garage rock revival / Alternative rock"
  },
  {
    "title": "Are You Experienced",
    "artist": "Jimi Hendrix",
    "year": 1967,
    "genre": "Psychedelic rock / Blues rock"
  },
  {
    "title": "Are You Gonna Go My Way",
    "artist": "Lenny Kravitz",
    "year": 1993,
    "genre": "Rock / Funk rock"
  },
  {
    "title": "Don't Speak",
    "artist": "No Doubt",
    "year": 1996,
    "genre": "Pop rock / Ska"
  },
  {
    "title": "Champagne Supernova",
    "artist": "Oasis",
    "year": 1996,
    "genre": "Britpop / Rock"
  },
  {
    "title": "Graceland",
    "artist": "Paul Simon",
    "year": 1986,
    "genre": "Worldbeat / Folk rock"
  },
  {
    "title": "Easy Lover",
    "artist": "Phil Collins",
    "year": 1984,
    "genre": "Pop rock / Dance-rock"
  },
  {
    "title": "Crazy Little Thing Called Love",
    "artist": "Queen",
    "year": 1979,
    "genre": "Rockabilly / Pop rock"
  },
  {
    "title": "Don’t Stop Me Now",
    "artist": "Queen",
    "year": 1979,
    "genre": "Rock / Pop rock"
  },
  {
    "title": "Creep",
    "artist": "Radiohead",
    "year": 1992,
    "genre": "Alternative rock / Grunge"
  },
  {
    "title": "Black Hole Sun",
    "artist": "Soundgarden",
    "year": 1994,
    "genre": "Grunge / Alternative rock"
  },
  {
    "title": "Eye Of The Tiger",
    "artist": "Survivor",
    "year": 1982,
    "genre": "Rock / Arena rock"
  },
  {
    "title": "A Hard Day's Night",
    "artist": "The Beatles",
    "year": 1964,
    "genre": "Rock / Pop rock"
  },
  {
    "title": "Come Together",
    "artist": "The Beatles",
    "year": 1969,
    "genre": "Psychedelic rock / Blues rock"
  },
  {
    "title": "Let It Be",
    "artist": "The Beatles",
    "year": 1970,
    "genre": "Pop rock / Soft rock"
  },
  {
    "title": "Brown Sugar",
    "artist": "The Rolling Stones",
    "year": 1971,
    "genre": "Rock / Hard rock"
  },
  {
    "title": "Hold The Line",
    "artist": "Toto",
    "year": 1978,
    "genre": "Rock / Hard rock"
  },
  {
    "title": "Brown Eyed Girl",
    "artist": "Van Morrison",
    "year": 1967,
    "genre": "Pop rock / Folk rock"
  },
  {
    "title": "All Shook Up",
    "artist": "Elvis Presley",
    "year": 1957,
    "genre": "Rock and roll / Rockabilly"
  },
  {
    "title": "Always on My Mind",
    "artist": "Elvis Presley",
    "year": 1972,
    "genre": "Country / Pop"
  },
  {
    "title": "Can't Help Falling in Love",
    "artist": "Elvis Presley",
    "year": 1961,
    "genre": "Pop / Ballad"
  },
  {
    "title": "A Little Less Conversation",
    "artist": "Elvis Presley",
    "year": 1968,
    "genre": "Rock and roll / Funk rock"
  },
  {
    "title": "Great Balls of Fire",
    "artist": "Jerry Lee Lewis",
    "year": 1957,
    "genre": "Rock and roll / Rockabilly"
  },
  {
    "title": "Bohemian Rhapsody",
    "artist": "Queen",
    "year": 1975,
    "genre": "Progressive rock / Art rock"
  },
  {
    "title": "La Bamba",
    "artist": "Ritchie Valens",
    "year": 1958,
    "genre": "Rock and roll / Latin rock"
  },
  {
    "title": "Greased Lightnin",
    "artist": "John Travolta (Grease Soundtrack)",
    "year": 1978,
    "genre": "Rock and roll / Soundtrack"
  },
  {
    "title": "Three Little Birds",
    "artist": "Bob Marley",
    "year": 1977,
    "genre": "Reggae"
  },
  {
    "title": "Buffalo Soldier",
    "artist": "Bob Marley",
    "year": 1983,
    "genre": "Reggae"
  },
  {
    "title": "Could You Be Loved",
    "artist": "Bob Marley",
    "year": 1980,
    "genre": "Reggae / Funk"
  },
  {
    "title": "Is This Love",
    "artist": "Bob Marley",
    "year": 1978,
    "genre": "Reggae"
  },
  {
    "title": "Jammin'",
    "artist": "Bob Marley",
    "year": 1977,
    "genre": "Reggae"
  },
  {
    "title": "No Woman, No Cry",
    "artist": "Bob Marley",
    "year": 1974,
    "genre": "Reggae"
  },
  {
    "title": "Baby I'm a Want You",
    "artist": "John Holt",
    "year": 1972,
    "genre": "Lovers Rock / Reggae"
  },
  {
    "title": "Boogie On Reggae Woman",
    "artist": "Stevie Wonder",
    "year": 1974,
    "genre": "Funk / Soul"
  },
  {
    "title": "Master Blaster (Jammin')",
    "artist": "Stevie Wonder",
    "year": 1980,
    "genre": "Reggae fusion / Funk"
  },
  {
    "title": "A Message to You Rudy",
    "artist": "The Specials",
    "year": 1979,
    "genre": "Ska / 2 Tone"
  },
  {
    "title": "Red, Red Wine",
    "artist": "UB40",
    "year": 1983,
    "genre": "Reggae / Pop"
  }, 
  {
    "title": "Love The One You're With",
    "artist": "Crosby, Stills & Nash",
    "year": 1970,
    "genre": "Folk Rock"
  },
  {
    "title": "Cannonball",
    "artist": "Damien Rice",
    "year": 2002,
    "genre": "Acoustic / Folk"
  },
  {
    "title": "Bad Love",
    "artist": "Eric Clapton",
    "year": 1989,
    "genre": "Rock / Blues"
  },
  {
    "title": "Fields of Gold",
    "artist": "Eva Cassidy",
    "year": 1996,
    "genre": "Folk / Acoustic"
  },
  {
    "title": "Good People",
    "artist": "Jack Johnson",
    "year": 2005,
    "genre": "Acoustic / Pop Rock"
  },
  {
    "title": "With a Little Help from My Friends",
    "artist": "Joe Cocker",
    "year": 1968,
    "genre": "Rock / Soul"
  },
  {
    "title": "Fast Car",
    "artist": "Tracy Chapman",
    "year": 1988,
    "genre": "Folk Rock"
  },
  {
    "title": "Give Me One Reason",
    "artist": "Tracy Chapman",
    "year": 1995,
    "genre": "Blues Rock"
  },
  {
    "title": "Achy Breaky Heart",
    "artist": "Billy Ray Cyrus",
    "year": 1992,
    "genre": "Country"
  },
  {
    "title": "9 to 5",
    "artist": "Dolly Parton",
    "year": 1980,
    "genre": "Country / Pop"
  },
  {
    "title": "Take Me Home, Country Roads",
    "artist": "John Denver",
    "year": 1971,
    "genre": "Country Folk"
  },
  {
    "title": "Dance the Night Away",
    "artist": "The Mavericks",
    "year": 1998,
    "genre": "Country / Rockabilly"
  },
  {
    "title": "Baby It's Cold Outside",
    "artist": "Ella Fitzgerald & Louis Jordan",
    "year": 1949,
    "genre": "Jazz / Christmas"
  },
  {
    "title": "All I Want for Christmas Is You",
    "artist": "Mariah Carey",
    "year": 1994,
    "genre": "Pop / Christmas"
  },
  {
    "title": "Getaway",
    "artist": "Earth, Wind & Fire",
    "year": 1976,
    "genre": "Funk / Soul"
  },
  {
    "title": "Amazing Grace",
    "artist": "Gospel Standard",
    "year": 1779,
    "genre": "Gospel / Hymn"
  },
  {
    "title": "God In Me",
    "artist": "Mary Mary",
    "year": 2008,
    "genre": "Gospel / R&B"
  },
  {
    "title": "I Feel the Earth Move",
    "artist": "Carole King",
    "year": 1971,
    "genre": "Pop Rock"
  },
  {
    "title": "All of Me",
    "artist": "Ella Fitzgerald",
    "year": 1957,
    "genre": "Jazz / Vocal Jazz"
  },
  {
    "title": "Cheek to Cheek",
    "artist": "Ella Fitzgerald",
    "year": 1956,
    "genre": "Jazz / Swing"
  },
  {
    "title": "Embraceable You",
    "artist": "Ella Fitzgerald",
    "year": 1952,
    "genre": "Jazz / Vocal Jazz"
  },
  {
    "title": "Come Fly With Me",
    "artist": "Frank Sinatra",
    "year": 1958,
    "genre": "Traditional Pop / Swing"
  },
  {
    "title": "Golden",
    "artist": "Jill Scott",
    "year": 2004,
    "genre": "R&B / Neo Soul"
  },
  {
    "title": "Diamonds Are a Girl's Best Friend",
    "artist": "Marilyn Monroe",
    "year": 1953,
    "genre": "Traditional Pop / Soundtrack"
  },
  {
    "title": "Feeling Good",
    "artist": "Nina Simone",
    "year": 1965,
    "genre": "Jazz / Soul"
  },
  {
    "title": "Smooth Operator",
    "artist": "Sade",
    "year": 1984,
    "genre": "Smooth Jazz / Soul"
  },
  {
    "title": "Bésame Mucho",
    "artist": "Frank Sinatra",
    "year": 1961,
    "genre": "Latin Jazz / Traditional Pop"
  }


        
  
          ]
      
    }
    }
  }
);