export const IGNORE_TOKENS = [
  "award-winning","best known for","notable","renowned","influential","leading"
];

export const ESTABLISHMENT = [
  { id:"E1", weight:+10, terms:["appointed","served as","held office","term as","cabinet","minister of","secretary of","commissioner","chief of staff","advisor to","special advisor","ambassador","appointed by"]},
  { id:"E2", weight:+8,  terms:["government official","public official","state official","civil servant","diplomat","regulatory","oversight","appointed to the board","board member","trustee"]},
  { id:"E3", weight:+8,  terms:["chief executive","ceo","executive","chairman","board of directors","founder and ceo","venture capital","private equity","hedge fund","investment firm","media executive","business magnate","industrialist","billionaire"]},
  { id:"E4", weight:-10, terms:["anti-establishment","anti-government","anarchist","anti-state","abolition of the state","refused to cooperate with authorities"]},
  { id:"E5", weight:-8,  terms:["exiled","blacklisted","banned by the government","political prisoner","dissident","underground movement","imprisoned for"]},
  { id:"E6", weight:-6,  terms:["grassroots","community organizer","mutual aid","direct action","street protests","civil disobedience","sit-in","sit-ins"]}
];

export const JUSTICE = [
  { id:"J1", weight:+14, terms:["civil rights","human rights","rights advocate","rights activist","anti-discrimination","equal rights","racial justice","social justice","voting rights","voter rights","voting access","voter suppression","voter participation"]},
  { id:"J2", weight:+12, terms:["anti-racism","anti-racist","racial equality","equity","diversity","inclusion","dei","systemic racism","racial discrimination"]},
  { id:"J3", weight:+12, terms:["feminist","women's rights","womens rights","gender equality","gender justice"]},
  { id:"J4", weight:+12, terms:["lgbt","lgbtq","gay rights","transgender rights","queer rights","same-sex marriage"]},
  { id:"J5", weight:+8,  terms:["disability rights","accessibility","americans with disabilities act","inclusive design","neurodiversity"]},
  { id:"J6", weight:-14, terms:["anti-woke","critic of social justice","opponent of dei","anti-dei","anti-critical race theory","anti-crt"]},
  { id:"J7", weight:+12, terms:["anti-capitalist","anti-capitalism","abolish capitalism","class struggle","class warfare","class war","marxist","marxism","socialist revolution","revolutionary socialist","means of production","worker control","proletariat","bourgeois","bourgeoisie"]},
  { id:"J8", weight:+10, terms:["anti-imperialist","anti-imperialism","american imperialism","imperialist","colonialism","decolonize","decolonization","settler colonialism"]},
  { id:"J9",  weight:+8,  terms:["left-wing","left wing","socialist","democratic socialist","progressive","far-left","hard-left"]},
  { id:"JD1", weight:-8,  terms:["bipartisan","both sides","centrist","moderate","nonpartisan","pragmatist","free speech","heterodox","contrarian","politically independent","independent commentator"]}
];

export const TRADITION = [
  { id:"T1", weight:+14, terms:["conservative","right-wing","right wing","far-right","hard-right","traditional values","social conservative","cultural conservative"]},
  { id:"T2", weight:+16, terms:["nationalist","ultranationalist","ethnonationalist","national conservatism","identitarian","Nazi","Nazism","fascist","fascism","neo-Nazi","neo-fascism","white supremacist","white nationalist","antisemitic","antisemitism","Kahanism","Kahanist","Jewish supremacist","settler movement","religious Zionism","great replacement","replacement theory","demographic replacement","race realist","race realism","white genocide","white identity","white pride"]},
  { id:"T3", weight:+12, terms:["religious conservative","evangelical","fundamentalist","religious traditionalist","faith-based politics","Catholic integralism","integralist","Christian nationalism","Christian nationalist","theocratic","religious state"]},
  { id:"T4", weight:+10, terms:["anti-immigration","immigration restriction","border security","deportation","mass deportation","refugee ban"]},
  { id:"T5", weight:+10, terms:["family values","law and order","tough on crime","pro-family"]},
  { id:"T6", weight:-14, terms:["progressive","left-wing","left wing","socialist","democratic socialist","communist"]},
  { id:"T7", weight:-10, terms:["multiculturalism","pluralist","cosmopolitan","globalist","pro-immigration"]},
  { id:"TD1", weight:-8, terms:["bipartisan","both sides","centrist","moderate","nonpartisan","pragmatist","free speech","heterodox","contrarian","politically independent","independent commentator"]}
];

export const CONFLICT = [
  { id:"C1",  weight:+10, terms:["controversial","widely criticized","sparked backlash","provoked outrage","condemned","denounced"]},
  { id:"C2",  weight:+10, terms:["accused of","allegations of","investigated","under investigation","charged with","convicted","lawsuit","settlement"]},
  { id:"C3",  weight:+8,  terms:["banned","deplatformed","suspended","removed from","expelled","censored"]},
  { id:"C4",  weight:+8,  terms:["outspoken","firebrand","provocateur","polarizing figure","culture warrior","shock jock","inflammatory"]},
  { id:"C5",  weight:+12, terms:["extremist","militia","paramilitary","insurrection","coup","terrorist","dictator","authoritarian","totalitarian","autocrat","despot","tyrant"]},
  { id:"C6",  weight:+14, terms:["genocide","ethnic cleansing","war criminal","crimes against humanity","Holocaust","mass murder","massacre","atrocity","extermination","pogrom","death squad","concentration camp"]},
  { id:"C7",  weight:+10, terms:["inflammatory statement","incendiary","called for revolution","revolutionary rhetoric","rage bait","agitprop"]},
  { id:"C8",  weight:+8,  terms:["arrested at a protest","arrested while protesting","arrested during a protest","protest arrest","arrested for protesting","civil disobedience arrest","demonstrators arrested","was arrested"]},
  { id:"CD1", weight:-10, terms:["moderate","centrist","nonpartisan","cross-party","consensus builder"]}
];

export const RIGIDITY = [
  { id:"R1",  weight:+12, terms:["hardline","staunch","uncompromising","unwavering","strict","zero tolerance"]},
  { id:"R2",  weight:+10, terms:["ideologue","dogmatic","purist","doctrinaire","absolutist"]},
  { id:"R3",  weight:+8,  terms:["total ban","complete ban","no exceptions","must be eliminated","eradicate","criminalize","mandatory","blanket ban"]},
  { id:"R4",  weight:+6,  terms:["conspiracy theorist","conspiracy theories","promoted conspiracy","qanon"]},
  { id:"R5",  weight:+14, terms:["Holocaust denier","Holocaust denial","denies the Holocaust","historical revisionist","historical revisionism","race science","eugenics","eugenicist","genocide denier","genocide denial"]},
  { id:"R6",  weight:+10, terms:["hunger strike","went on hunger strike","hunger striker","self-immolation","fasting in protest","chained himself","chained herself","chained themselves"]},
  { id:"RD1", weight:-12, terms:["pragmatic","technocrat","incremental","compromise","worked across the aisle"]}
];
