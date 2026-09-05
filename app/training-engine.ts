export type WeakPoint = "grammar" | "pronunciation" | "speed" | "vocabulary" | "fluency";

export type DrillKind =
  | "Voice diary"
  | "Dialogue & meaning"
  | "Repetition drill"
  | "Backward build-up"
  | "Substitution drill"
  | "Transformation drill"
  | "Response drill"
  | "Question & answer"
  | "Expansion drill"
  | "Situation drill"
  | "Recombination";

export type StageId =
  | "warmup"
  | "lock"
  | "reaction"
  | "transform"
  | "speed"
  | "real"
  | "boss";

export type DrillSeed = {
  cue: string;
  answer: string;
  transferCue: string;
  transferAnswer: string;
  hint?: string;
  tags?: WeakPoint[];
};

export type PatternDefinition = {
  id: string;
  level: number;
  cefr: "B1" | "B1+" | "B2";
  title: string;
  frame: string;
  meaning: string;
  world: string;
  rule: string;
  unlockAt: number;
  examples: string[];
  substitutions: DrillSeed[];
  transformations: DrillSeed[];
  responses: DrillSeed[];
  situations: DrillSeed[];
  boss: DrillSeed;
};

export type DrillPrompt = DrillSeed & {
  id: string;
  stageId: StageId;
  level: number;
  kind: DrillKind;
  instruction: string;
  openAnswer?: boolean;
};

export const stages: Array<{
  id: StageId;
  code: string;
  title: string;
  subtitle: string;
  method: string;
  level: number;
}> = [
  {
    id: "warmup",
    code: "STAGE 1",
    title: "WARM UP",
    subtitle: "Switch your brain into English",
    method: "Voice diary · retrieval",
    level: 1,
  },
  {
    id: "lock",
    code: "STAGE 2",
    title: "PATTERN LOCK",
    subtitle: "Hear the shape. Copy the rhythm.",
    method: "Meaning · repetition · backward build-up",
    level: 1,
  },
  {
    id: "reaction",
    code: "STAGE 3",
    title: "3-SECOND DRILL",
    subtitle: "Keep the frame. Swap the message.",
    method: "Substitution drill",
    level: 2,
  },
  {
    id: "transform",
    code: "STAGE 4",
    title: "SHAPE SHIFT",
    subtitle: "Change the form without translating",
    method: "Transformation drill",
    level: 3,
  },
  {
    id: "speed",
    code: "STAGE 5",
    title: "SPEED MODE",
    subtitle: "Answer the person, not the textbook",
    method: "Response · question-and-answer",
    level: 4,
  },
  {
    id: "real",
    code: "STAGE 6",
    title: "REAL LIFE",
    subtitle: "Use the pattern in Canadian life",
    method: "Expansion · situation drill",
    level: 5,
  },
  {
    id: "boss",
    code: "FINAL BOSS",
    title: "SPEAK WITHOUT HELP",
    subtitle: "Recombine the pattern under pressure",
    method: "Recombination · free response",
    level: 7,
  },
];

const focusedPattern: PatternDefinition = {
  id: "focused-on",
  level: 1,
  cefr: "B1",
  title: "Focus, goals & English mode",
  frame: "Right now, I'm focused on ___ing.",
  meaning: "现在，我正专注于……",
  world: "Daily goals · Canada plan · study habits · confidence",
  rule: "focused on + noun or verb-ing (not ‘focused on + base verb’)",
  unlockAt: 0,
  examples: [
    "Right now, I'm focused on speaking English more naturally.",
    "Right now, I'm focused on answering faster without translating in my head.",
    "Right now, I'm focused on staying calm and solving my visa problem.",
  ],
  substitutions: [
    {
      cue: "现在，我正专注于养成更好的习惯。",
      answer: "Right now, I'm focused on building better habits.",
      transferCue: "现在，我正专注于保持稳定。",
      transferAnswer: "Right now, I'm focused on staying consistent.",
      hint: "focused on + building / staying",
      tags: ["grammar", "speed"],
    },
    {
      cue: "现在，我正专注于减少干扰。",
      answer: "Right now, I'm focused on reducing distractions.",
      transferCue: "现在，我正专注于管理时间。",
      transferAnswer: "Right now, I'm focused on managing my time.",
      hint: "reduce → reducing · manage → managing",
      tags: ["grammar", "pronunciation"],
    },
    {
      cue: "现在，我正专注于准备加拿大高中生活。",
      answer: "Right now, I'm focused on preparing for high school in Canada.",
      transferCue: "现在，我正专注于准备开学。",
      transferAnswer: "Right now, I'm focused on getting ready for school.",
      hint: "prepare for + noun · get ready for + noun",
      tags: ["vocabulary", "fluency"],
    },
    {
      cue: "现在，我正专注于修正发音。",
      answer: "Right now, I'm focused on improving my pronunciation.",
      transferCue: "现在，我正专注于学习实用语块。",
      transferAnswer: "Right now, I'm focused on learning useful chunks.",
      hint: "improving pronunciation · learning chunks",
      tags: ["pronunciation", "vocabulary"],
    },
  ],
  transformations: [
    {
      cue: "Correct the form：Right now, I'm focus on answer faster.",
      answer: "Right now, I'm focused on answering faster.",
      transferCue: "Correct the form：I'm focused on speak clearly.",
      transferAnswer: "I'm focused on speaking clearly.",
      hint: "am focused · on + verb-ing",
      tags: ["grammar"],
    },
    {
      cue: "Change I to WE：I'm focused on finishing this plan.",
      answer: "We're focused on finishing this plan.",
      transferCue: "Change WE to SHE：We're focused on preparing for class.",
      transferAnswer: "She's focused on preparing for class.",
      hint: "we are → we're · she is → she's",
      tags: ["grammar", "fluency"],
    },
    {
      cue: "Add a reason：专注口语，因为想停止脑内翻译。",
      answer: "Right now, I'm focused on speaking because I want to stop translating in my head.",
      transferCue: "Add a reason：专注 timetable，因为想避免迟到。",
      transferAnswer: "Right now, I'm focused on organizing my timetable because I want to avoid being late.",
      hint: "target pattern + because + reason",
      tags: ["fluency", "grammar"],
    },
  ],
  responses: [
    {
      cue: "Classmate: What are you working on these days?",
      answer: "Right now, I'm focused on improving my English and getting ready for school.",
      transferCue: "Teacher: What's your main goal this week?",
      transferAnswer: "Right now, I'm focused on answering more quickly in class.",
      hint: "Answer the person directly, then stop.",
      tags: ["speed", "fluency"],
    },
    {
      cue: "Guidance counsellor: What would you like to improve first?",
      answer: "Right now, I'm focused on understanding classroom English more easily.",
      transferCue: "New friend: What are you trying to get better at?",
      transferAnswer: "Right now, I'm focused on speaking more naturally.",
      hint: "Use a real goal, not an abstract textbook answer.",
      tags: ["speed", "vocabulary"],
    },
    {
      cue: "Homestay parent: How are you preparing for your first week?",
      answer: "Right now, I'm focused on learning the school routine and staying organized.",
      transferCue: "Tutor: How are you preparing for your presentation?",
      transferAnswer: "Right now, I'm focused on practicing my opening and speaking clearly.",
      hint: "Two -ing actions can share the same pattern.",
      tags: ["fluency", "speed"],
    },
  ],
  situations: [
    {
      cue: "Orientation：向一位加拿大同学介绍你现在的三个重点。",
      answer: "Right now, I'm focused on settling into school, making new friends, and speaking English more naturally.",
      transferCue: "Teacher meeting：说明你这周最想改善的两件事和原因。",
      transferAnswer: "Right now, I'm focused on understanding instructions and answering faster because I want to participate more in class.",
      hint: "One pattern + a list of two or three real actions",
      tags: ["fluency", "vocabulary"],
    },
    {
      cue: "Study plan：用 30 秒说明你现在专注什么、为什么、下一步是什么。",
      answer: "Right now, I'm focused on building a consistent English routine because I need faster reactions. My next step is to practice one pattern until it feels automatic.",
      transferCue: "Canada plan：换一个真实目标再说 30 秒。",
      transferAnswer: "Right now, I'm focused on preparing for school in Canada. I'm learning useful classroom chunks so I can ask for help without translating first.",
      hint: "Focus → reason → next step",
      tags: ["fluency", "vocabulary"],
    },
  ],
  boss: {
    cue: "FINAL BOSS：不看稿说 45 秒 ‘What I’m focused on right now’。至少使用目标句型三次。",
    answer: "Right now, I'm focused on speaking English every day. I'm also focused on answering faster without translating in my head. Most importantly, I'm focused on staying consistent and disciplined.",
    transferCue: "TRANSFER：换成加拿大高中第一周，再说 30 秒，不重复刚才的动词。",
    transferAnswer: "Right now, I'm focused on learning my timetable, meeting my teachers, and getting comfortable with classroom English.",
    hint: "Three target sentences. Use a natural connector before the last one.",
    tags: ["fluency", "speed"],
  },
};

const supposedPattern: PatternDefinition = {
  id: "supposed-ended",
  level: 1,
  cefr: "B1",
  title: "Plans that changed",
  frame: "I was supposed to ___, but I ended up ___ing.",
  meaning: "本来应该……，结果却……",
  world: "Routines · deadlines · transit · school",
  rule: "supposed to + base verb · ended up + verb-ing",
  unlockAt: 0,
  examples: [
    "I was supposed to wake up at seven, but I ended up sleeping until nine.",
    "I was supposed to start studying at nine, but I ended up putting it off until noon.",
    "I was supposed to email my teacher, but I ended up forgetting about it until the evening.",
  ],
  substitutions: [
    {
      cue: "你本来应该去健身房，但最后待在家里看视频。",
      answer: "I was supposed to go to the gym, but I ended up staying home and watching videos.",
      transferCue: "你本来应该去图书馆，但最后待在宿舍。",
      transferAnswer: "I was supposed to go to the library, but I ended up staying in my room.",
      hint: "go to the gym → stay home and watch videos",
      tags: ["grammar", "fluency"],
    },
    {
      cue: "你本来应该坐八点的公交车，但最后错过了，只好叫出租车。",
      answer: "I was supposed to take the bus at eight, but I ended up missing it and calling a taxi.",
      transferCue: "你本来应该搭校车，但最后错过了，只好坐地铁。",
      transferAnswer: "I was supposed to take the school bus, but I ended up missing it and taking the subway.",
      hint: "take the bus → miss it → call a taxi",
      tags: ["grammar", "speed"],
    },
    {
      cue: "你本来应该晚饭前完成作业，但最后学到了深夜。",
      answer: "I was supposed to finish my homework before dinner, but I ended up studying late into the night.",
      transferCue: "你本来应该九点前完成物理作业，但最后做到了午夜。",
      transferAnswer: "I was supposed to finish my physics assignment by nine, but I ended up working on it until midnight.",
      hint: "finish before dinner → study late into the night",
      tags: ["grammar", "vocabulary"],
    },
    {
      cue: "你本来应该放松十分钟，但最后休息了一个小时。",
      answer: "I was supposed to take a ten-minute break, but I ended up taking an hour-long break.",
      transferCue: "你本来应该快速看一眼手机，但最后刷了四十分钟。",
      transferAnswer: "I was supposed to check my phone quickly, but I ended up scrolling for forty minutes.",
      hint: "a ten-minute break / an hour-long break",
      tags: ["grammar", "speed"],
    },
    {
      cue: "你本来应该三点见同学，但签证预约让你最后改了时间。",
      answer: "I was supposed to meet my classmate at three, but I ended up changing the time because of a visa appointment.",
      transferCue: "你本来应该午餐时见指导老师，但医生预约让你最后改到了四点。",
      transferAnswer: "I was supposed to meet my guidance counsellor at lunch, but I ended up rescheduling the meeting for four because of a doctor's appointment.",
      hint: "meet at three → change the time",
      tags: ["grammar", "vocabulary"],
    },
  ],
  transformations: [
    {
      cue: "Combine：I planned to leave at eight. I spent twenty minutes looking for my keys.",
      answer: "I was supposed to leave at eight, but I ended up spending twenty minutes looking for my keys.",
      transferCue: "Combine：I planned to submit it before class. I emailed it after lunch.",
      transferAnswer: "I was supposed to submit it before class, but I ended up emailing it after lunch.",
      hint: "Turn plan + result into one sentence.",
      tags: ["grammar"],
    },
    {
      cue: "Change SHE to I：She was supposed to present first, but she ended up going last.",
      answer: "I was supposed to present first, but I ended up going last.",
      transferCue: "Change THEY to WE：They were supposed to work alone, but they ended up working together.",
      transferAnswer: "We were supposed to work alone, but we ended up working together.",
      hint: "Keep the tense; change the subject and be-verb.",
      tags: ["grammar"],
    },
    {
      cue: "Make it negative：You were supposed to bring your laptop, but you brought it.",
      answer: "I was supposed to bring my laptop, but I ended up not bringing it.",
      transferCue: "Make it negative：You were supposed to attend the meeting, but you did not go.",
      transferAnswer: "I was supposed to attend the meeting, but I ended up not going.",
      hint: "ended up not + verb-ing",
      tags: ["grammar", "fluency"],
    },
    {
      cue: "Add reason：You missed the deadline because the school portal stopped working.",
      answer: "I was supposed to submit it on time, but I ended up missing the deadline because the school portal stopped working.",
      transferCue: "Add reason：You arrived late because the bus was delayed.",
      transferAnswer: "I was supposed to arrive on time, but I ended up being late because the bus was delayed.",
      hint: "Full pattern + because + reason",
      tags: ["grammar", "fluency"],
    },
  ],
  responses: [
    {
      cue: "Teacher: Did you finish the assignment before class?",
      answer: "I was supposed to, but I ended up finishing it during lunch.",
      transferCue: "Teacher: Did you upload your slides last night?",
      transferAnswer: "I was supposed to, but I ended up uploading them this morning.",
      hint: "Respond naturally; do not repeat every noun.",
      tags: ["speed", "fluency"],
    },
    {
      cue: "Classmate: Why didn't you take the school bus?",
      answer: "I was supposed to take it, but I ended up missing it and taking the subway.",
      transferCue: "Classmate: Why didn't you come to the cafeteria?",
      transferAnswer: "I was supposed to come, but I ended up meeting my guidance counsellor instead.",
      hint: "Answer the why-question with the target frame.",
      tags: ["speed", "vocabulary"],
    },
    {
      cue: "Homestay parent: Weren't you going to be home for dinner?",
      answer: "I was supposed to be home, but I ended up staying late for a group project.",
      transferCue: "Friend: Weren't you going to join us after school?",
      transferAnswer: "I was supposed to join you, but I ended up going to a visa appointment.",
      hint: "Acknowledge the plan, then explain the result.",
      tags: ["speed", "fluency"],
    },
    {
      cue: "Guidance counsellor: Did you choose physics for next term?",
      answer: "I was supposed to choose physics, but I ended up choosing computer science instead.",
      transferCue: "Counsellor: Did you keep your morning English class?",
      transferAnswer: "I was supposed to keep it, but I ended up switching to the afternoon class.",
      hint: "Use instead to make the changed choice clear.",
      tags: ["speed", "vocabulary"],
    },
  ],
  situations: [
    {
      cue: "Deadline situation：向老师解释为什么作业晚交。必须包含原计划、实际结果、原因。",
      answer: "I was supposed to submit my assignment last night, but I ended up sending it this morning because the school portal wasn't working.",
      transferCue: "Presentation situation：向小组解释为什么你的 slides 今天早上才完成。",
      transferAnswer: "I was supposed to finish my slides before dinner, but I ended up working on them this morning because my laptop crashed.",
      hint: "Plan → unexpected result → concrete reason",
      tags: ["fluency", "vocabulary"],
    },
    {
      cue: "Transit situation：告诉同学你为什么迟到，以及你最后怎么到学校。",
      answer: "I was supposed to catch the school bus, but I ended up missing it, so I took the subway and walked from the station.",
      transferCue: "Medical situation：告诉老师你为什么错过第一节课。",
      transferAnswer: "I was supposed to be in class, but I ended up going to a walk-in clinic because I had a bad headache.",
      hint: "Use so to add what you did next.",
      tags: ["fluency", "vocabulary"],
    },
    {
      cue: "Group project：你本来只负责 research，最后还做了 presentation。解释发生了什么。",
      answer: "I was supposed to handle the research, but I ended up giving the presentation too because my teammate was absent.",
      transferCue: "Course selection：你原计划选化学，但最后选了生物。说明原因。",
      transferAnswer: "I was supposed to take chemistry, but I ended up choosing biology because it fit my timetable better.",
      hint: "Keep the pattern, then add one useful detail.",
      tags: ["fluency", "vocabulary"],
    },
  ],
  boss: {
    cue: "FINAL BOSS：用 30–45 秒讲一个今天没有按计划发展的真实故事。至少用目标句型两次，并补充原因和结果。",
    answer: "I was supposed to follow my schedule today, but I ended up changing it after a visa email arrived. I was also supposed to study at home, but I ended up going to the library because I needed a quiet place. In the end, I still finished the most important task.",
    transferCue: "TRANSFER：换一个加拿大高中场景，再讲 30 秒。不要重复刚才的动词。",
    transferAnswer: "I was supposed to meet my group at lunch, but I ended up seeing the guidance counsellor instead. We were supposed to rehearse in the library, but we ended up practicing after school because one teammate was late.",
    hint: "Two pattern sentences + one ending sentence. No script.",
    tags: ["fluency", "speed"],
  },
};

export const patterns: PatternDefinition[] = [
  focusedPattern,
  supposedPattern,
  {
    id: "usually-today",
    level: 2,
    cefr: "B1",
    title: "Routine vs. today",
    frame: "I usually ___, but today I'm ___ing because ___.",
    meaning: "我通常……，但今天因为……正在……",
    world: "Timetable · school bus · cafeteria · homestay",
    rule: "usually + present simple · today + present continuous",
    unlockAt: 0,
    examples: [
      "I usually study at home, but today I'm working at the library because I need a quiet place.",
      "I usually take the bus, but today I'm taking a taxi because I'm running late.",
      "I usually eat at home, but today I'm eating at school because I have an afternoon class.",
    ],
    substitutions: [
      { cue: "通常晚上健身；今天早上去；今晚很忙。", answer: "I usually go to the gym in the evening, but today I'm going in the morning because I'm busy tonight.", transferCue: "通常放学后学习；今天午餐时间学；放学后有预约。", transferAnswer: "I usually study after school, but today I'm studying at lunch because I have an appointment after school." },
      { cue: "通常把手机放身边；今天放另一个房间；需要专注。", answer: "I usually keep my phone nearby, but today I'm leaving it in another room because I need to focus.", transferCue: "通常在房间做作业；今天在厨房做；室友在开会。", transferAnswer: "I usually do my homework in my room, but today I'm working in the kitchen because my roommate is in a meeting." },
      { cue: "通常独自学习；今天和朋友一起；需要物理帮助。", answer: "I usually study alone, but today I'm studying with a friend because I need help with physics.", transferCue: "通常自己吃午饭；今天和新同学一起；想认识他们。", transferAnswer: "I usually eat lunch alone, but today I'm eating with new classmates because I want to get to know them." },
    ],
    transformations: [
      { cue: "Change today to yesterday and keep the contrast.", answer: "I usually study at home, but yesterday I studied at the library because I needed a quiet place.", transferCue: "Change this to yesterday: usually bus / taxi / running late.", transferAnswer: "I usually take the bus, but yesterday I took a taxi because I was running late." },
      { cue: "Make the second half negative: today / not eating at home / club meeting.", answer: "I usually eat at home, but today I'm not eating at home because I have a club meeting.", transferCue: "Make the second half negative: today / not taking the bus / snowstorm.", transferAnswer: "I usually take the bus, but today I'm not taking it because of the snowstorm." },
    ],
    responses: [
      { cue: "Classmate: Don't you normally study at home?", answer: "I usually do, but today I'm studying here because I need help with physics.", transferCue: "Homestay parent: Don't you normally come home for dinner?", transferAnswer: "I usually do, but today I'm eating at school because I have basketball practice." },
      { cue: "Teacher: Why are you sitting at the front today?", answer: "I usually sit at the back, but today I'm sitting at the front because I need to see the board clearly.", transferCue: "Friend: Why are you taking the subway today?", transferAnswer: "I usually take the school bus, but today I'm taking the subway because I missed it." },
    ],
    situations: [
      { cue: "向 homestay family 解释今天三处 routine changes。", answer: "I usually come home right after school, but today I'm staying late because I have a group project. I usually eat at home, but today I'm eating at school. I usually go to bed early, but tonight I'm preparing for a presentation.", transferCue: "向同学解释你今天不同的上学路线。", transferAnswer: "I usually take the school bus, but today I'm taking the subway because the bus was cancelled." },
      { cue: "告诉老师你今天为什么换了座位和学习方式。", answer: "I usually sit with my friend, but today I'm sitting near the front because I need to focus. I usually take notes on my laptop, but today I'm writing by hand because my battery is dead.", transferCue: "告诉同学你今天午餐安排为何不同。", transferAnswer: "I usually bring lunch, but today I'm eating in the cafeteria because I didn't have time to pack anything." },
    ],
    boss: { cue: "FINAL BOSS：讲 45 秒 ‘My usual school day vs. today’，使用三次目标句型。", answer: "I usually take the school bus, but today I'm taking the subway because I'm running late. I usually eat lunch with one friend, but today I'm joining my group because we need to plan our presentation. I usually study at home, but today I'm staying at the library because I have a deadline.", transferCue: "TRANSFER：换成周末 routine，用三个新动词。", transferAnswer: "I usually sleep in on Saturdays, but today I'm getting up early because I have an appointment." },
  },
  {
    id: "didnt-catch",
    level: 3,
    cefr: "B1",
    title: "Clarify what you heard",
    frame: "I didn't catch ___. Could you ___?",
    meaning: "我没听清……，你能……吗？",
    world: "Class · teachers · doctors · public transit",
    rule: "didn't + base verb · could you + base verb",
    unlockAt: 1400,
    examples: [
      "I didn't catch the last part. Could you say that again?",
      "I didn't catch which page you said. Could you repeat the page number?",
      "I didn't catch the stop name. Could you let me know where to get off?",
    ],
    substitutions: [
      { cue: "没听清截止日期；请老师重复。", answer: "I didn't catch the deadline. Could you repeat it?", transferCue: "没听清教室号码；请对方再说一次。", transferAnswer: "I didn't catch the room number. Could you say it again?" },
      { cue: "没听懂作业要求；请老师解释简单一点。", answer: "I didn't catch the assignment instructions. Could you explain them in a simpler way?", transferCue: "没听懂医生的建议；请再解释一次。", transferAnswer: "I didn't catch the doctor's advice. Could you explain it again?" },
      { cue: "没听清公交站名；请司机到站提醒。", answer: "I didn't catch the stop name. Could you let me know when we get there?", transferCue: "没听清换乘站；请乘客指给你看。", transferAnswer: "I didn't catch where to transfer. Could you show me on the map?" },
    ],
    transformations: [
      { cue: "Make polite: What did you say?", answer: "I didn't catch that. Could you say it again?", transferCue: "Make polite: Speak slower.", transferAnswer: "I didn't catch everything. Could you speak a little more slowly?" },
      { cue: "Specify the unclear part: group-project role.", answer: "I didn't catch what my role is. Could you go over that part again?", transferCue: "Specify the unclear part: medication schedule.", transferAnswer: "I didn't catch how often I should take it. Could you go over that again?" },
    ],
    responses: [
      { cue: "Teacher speaks too quickly. Repair the conversation.", answer: "Sorry, I didn't catch the last part. Could you say it a little more slowly?", transferCue: "A cashier says something you missed. Repair politely.", transferAnswer: "Sorry, I didn't catch that. Could you repeat it?" },
      { cue: "A classmate gives unclear directions to the lab.", answer: "I didn't catch where the lab is. Could you show me?", transferCue: "A bus driver gives unclear transfer instructions.", transferAnswer: "I didn't catch where I need to transfer. Could you say that again?" },
    ],
    situations: [
      { cue: "课堂：连续澄清 deadline、页码和小组要求。", answer: "I didn't catch the deadline. Could you repeat it? I also didn't catch which pages we need to read. Could you go over that part again?", transferCue: "诊所：澄清药物用量和复诊日期。", transferAnswer: "I didn't catch how often I should take this. Could you explain it again?" },
      { cue: "公共交通：你没听清换乘信息，礼貌求助。", answer: "I didn't catch the transfer announcement. Could you tell me whether I need to change trains here?", transferCue: "食堂：你没听清配料，确认是否含坚果。", transferAnswer: "I didn't catch what was in the sauce. Could you tell me whether it contains nuts?" },
    ],
    boss: { cue: "FINAL BOSS：模拟一段 45 秒课堂对话。你需要三次自然澄清，不说 ‘What?’。", answer: "Sorry, I didn't catch the due date. Could you repeat it? I also didn't catch whether we're working alone. Could you go over that part again?", transferCue: "TRANSFER：换成 walk-in clinic 场景。", transferAnswer: "I didn't catch the dosage. Could you explain how often I should take it?" },
  },
  {
    id: "trying-need",
    level: 4,
    cefr: "B1+",
    title: "Ask for useful help",
    frame: "I'm trying to ___, so I need ___. Could you ___?",
    meaning: "我正在努力……，所以我需要……。你能……吗？",
    world: "Requests · office · class · shopping",
    rule: "trying to + base verb · need + noun/to-infinitive",
    unlockAt: 1600,
    examples: [
      "I'm trying to catch up, so I need the notes. Could you send them to me?",
      "I'm trying to choose my courses, so I need some advice. Could you look at my timetable?",
      "I'm trying to find the right bus, so I need directions. Could you point me to the stop?",
    ],
    substitutions: [
      { cue: "想补上课程；需要笔记；请同学发给你。", answer: "I'm trying to catch up, so I need the notes. Could you send them to me?", transferCue: "想完成实验；需要数据；请组员分享。", transferAnswer: "I'm trying to finish the lab, so I need the data. Could you share it with me?" },
      { cue: "想选课；需要建议；请 counsellor 看 timetable。", answer: "I'm trying to choose my courses, so I need some advice. Could you look at my timetable?", transferCue: "想换课程；需要表格；请办公室给一份。", transferAnswer: "I'm trying to change courses, so I need the form. Could you give me a copy?" },
      { cue: "想退货；需要收据；请店员帮忙查。", answer: "I'm trying to return this, so I need the receipt. Could you help me look it up?", transferCue: "想点无坚果餐；需要配料信息；请服务员确认。", transferAnswer: "I'm trying to avoid nuts, so I need the ingredient list. Could you check it for me?" },
    ],
    transformations: [
      { cue: "Make it more polite: Help me with my timetable.", answer: "I'm trying to organize my timetable, so I need some help. Could you take a look?", transferCue: "Make it more polite: Explain this question.", transferAnswer: "I'm trying to understand this question, so I need some help. Could you explain it?" },
      { cue: "Change need + noun to need to + verb.", answer: "I'm trying to meet the deadline, so I need to work faster. Could you check my outline?", transferCue: "Use need to find out.", transferAnswer: "I'm trying to register, so I need to find out which form to use. Could you show me?" },
    ],
    responses: [
      { cue: "Teacher: How can I help?", answer: "I'm trying to improve my introduction, so I need feedback. Could you listen to it?", transferCue: "Counsellor: What do you need?", transferAnswer: "I'm trying to choose a science course, so I need some advice. Could you compare these two options?" },
      { cue: "Clerk: Are you looking for something?", answer: "I'm trying to find a winter jacket, so I need a warmer one. Could you show me some options?", transferCue: "Librarian: Can I help you?", transferAnswer: "I'm trying to print my assignment, so I need a computer. Could you tell me which one is free?" },
    ],
    situations: [
      { cue: "Office mission：向 guidance counsellor 请求选课帮助。", answer: "I'm trying to choose courses for next term, so I need some advice. Could you check whether this timetable meets the requirements?", transferCue: "Class mission：向老师请求 deadline clarification。", transferAnswer: "I'm trying to plan my week, so I need the exact deadline. Could you confirm it?" },
      { cue: "Daily-life mission：在药店请求帮助找到头痛药。", answer: "I'm trying to find something for a headache, so I need some advice. Could you show me the non-drowsy options?", transferCue: "Transit mission：请求别人帮你找到正确站台。", transferAnswer: "I'm trying to get downtown, so I need the right platform. Could you point me in the right direction?" },
    ],
    boss: { cue: "FINAL BOSS：完成一个 45 秒 request chain：说明目标、需要、具体请求、follow-up。", answer: "I'm trying to choose my courses, so I need some advice. Could you look at my timetable? I also need to know whether physics is required for the program I'm considering.", transferCue: "TRANSFER：换成 group project 场景。", transferAnswer: "I'm trying to finish our presentation, so I need the latest slides. Could you upload them and tell me which section still needs work?" },
  },
  {
    id: "reason-is-that",
    level: 5,
    cefr: "B1+",
    title: "Explain the real reason",
    frame: "The reason I ___ is that ___.",
    meaning: "我之所以……，是因为……",
    world: "Absence · lateness · deadlines · decisions",
    rule: "reason + clause · is that + complete clause",
    unlockAt: 1850,
    examples: [
      "The reason I was late is that the school bus never showed up.",
      "The reason I missed class is that I had a visa appointment.",
      "The reason I chose biology is that it fits my timetable better.",
    ],
    substitutions: [
      { cue: "迟到；校车没来。", answer: "The reason I was late is that the school bus never showed up.", transferCue: "缺课；有医生预约。", transferAnswer: "The reason I missed class is that I had a doctor's appointment." },
      { cue: "晚交；学校 portal 不能用。", answer: "The reason I submitted it late is that the school portal wasn't working.", transferCue: "没回邮件；没看到通知。", transferAnswer: "The reason I didn't reply is that I didn't see the notification." },
      { cue: "选生物；更符合 timetable。", answer: "The reason I chose biology is that it fits my timetable better.", transferCue: "拒绝活动；要准备 presentation。", transferAnswer: "The reason I can't join you is that I have to prepare for a presentation." },
    ],
    transformations: [
      { cue: "Replace because: I left early because I had an appointment.", answer: "The reason I left early is that I had an appointment.", transferCue: "Replace because: I asked for help because I was confused.", transferAnswer: "The reason I asked for help is that I was confused." },
      { cue: "Make present: I chose it because it is practical.", answer: "The reason I'm choosing it is that it's practical.", transferCue: "Make future decision: I will stay late because we need to rehearse.", transferAnswer: "The reason I'll stay late is that we need to rehearse." },
    ],
    responses: [
      { cue: "Teacher: Why were you absent yesterday?", answer: "The reason I was absent is that I had a visa appointment.", transferCue: "Counsellor: Why do you want to change courses?", transferAnswer: "The reason I want to change courses is that this one conflicts with math." },
      { cue: "Friend: Why can't you come tonight?", answer: "The reason I can't come is that I have to finish a group project.", transferCue: "Homestay parent: Why will you be home late?", transferAnswer: "The reason I'll be home late is that our group needs to rehearse." },
    ],
    situations: [
      { cue: "向老师解释两件事：缺课 + 晚交。", answer: "The reason I missed class is that I had a doctor's appointment. The reason I submitted the assignment late is that I couldn't access the school portal.", transferCue: "向 counsellor 解释选课变化。", transferAnswer: "The reason I want to switch courses is that the new class fits my timetable better." },
      { cue: "礼貌拒绝朋友并给出真实理由。", answer: "I can't join you tonight. The reason I need to stay home is that I have a presentation tomorrow.", transferCue: "向 homestay family 解释晚归。", transferAnswer: "The reason I'll be home late is that I have basketball practice after school." },
    ],
    boss: { cue: "FINAL BOSS：用目标句型解释三个真实决定，45 秒。", answer: "The reason I'm studying English this way is that I want faster reactions. The reason I'm focusing on school English is that I'll use it every day in Canada.", transferCue: "TRANSFER：解释三个学校里的问题。", transferAnswer: "The reason I was late is that the bus was delayed." },
  },
  {
    id: "see-point",
    level: 6,
    cefr: "B1+",
    title: "Disagree without sounding rude",
    frame: "I see your point, but I think ___.",
    meaning: "我理解你的观点，但我认为……",
    world: "Group projects · class discussion · opinions",
    rule: "acknowledge first · disagree with one clear reason",
    unlockAt: 2150,
    examples: [
      "I see your point, but I think we need more time to rehearse.",
      "I see your point, but I think this topic is easier to explain.",
      "I see your point, but I don't think everyone has agreed yet.",
    ],
    substitutions: [
      { cue: "理解对方，但认为需要更多 rehearsal time。", answer: "I see your point, but I think we need more time to rehearse.", transferCue: "理解对方，但认为 presentation 太长。", transferAnswer: "I see your point, but I think the presentation is too long." },
      { cue: "理解对方，但认为 topic B 更容易解释。", answer: "I see your point, but I think topic B is easier to explain.", transferCue: "理解对方，但认为图表更清楚。", transferAnswer: "I see your point, but I think a chart would be clearer." },
      { cue: "理解对方，但不认为所有人都同意。", answer: "I see your point, but I don't think everyone has agreed yet.", transferCue: "理解对方，但不认为 deadline realistic。", transferAnswer: "I see your point, but I don't think the deadline is realistic." },
    ],
    transformations: [
      { cue: "Soften: You're wrong. We need another day.", answer: "I see your point, but I think we need another day.", transferCue: "Soften: That's a bad topic.", transferAnswer: "I see your point, but I think another topic might work better." },
      { cue: "Add a reason: prefer slides / easier to follow.", answer: "I see your point, but I think we should use slides because they're easier to follow.", transferCue: "Add a reason: meet after school / everyone is free.", transferAnswer: "I see your point, but I think we should meet after school because everyone is free then." },
    ],
    responses: [
      { cue: "Teammate: Let's skip the rehearsal.", answer: "I see your point, but I think we should rehearse once so we can fix the timing.", transferCue: "Teammate: Let's put all the text on one slide.", transferAnswer: "I see your point, but I think we should split it up so it's easier to read." },
      { cue: "Classmate: Online classes are always better.", answer: "I see your point, but I think in-person classes make it easier to ask questions.", transferCue: "Friend: Group projects are a waste of time.", transferAnswer: "I see your point, but I think they can teach us how to work with different people." },
    ],
    situations: [
      { cue: "Group Project：不同意 topic、deadline 和工作分配，但保持礼貌。", answer: "I see your point, but I think another topic would be clearer. I also think we need to divide the work more evenly.", transferCue: "Course discussion：对 online vs. in-person 表达不同意见。", transferAnswer: "I see your point, but I think in-person classes are better for discussion." },
      { cue: "Cafeteria debate：朋友想去很贵的餐厅，你礼貌提出另一方案。", answer: "I see your point, but I think we should choose somewhere cheaper so everyone can come.", transferCue: "School club：同伴想取消活动，你提出替代。", transferAnswer: "I see your point, but I think we could move it indoors instead of cancelling it." },
    ],
    boss: { cue: "FINAL BOSS：进行 60 秒 group-project disagreement。先认可、再反对、给理由、提方案。", answer: "I see your point, but I think we need a shorter topic because we only have five minutes. We could focus on one example and use a simple chart.", transferCue: "TRANSFER：换成 course selection disagreement。", transferAnswer: "I see your point, but I think biology fits my goals better because I'm interested in health science." },
  },
  {
    id: "rather-because",
    level: 7,
    cefr: "B2",
    title: "Choose and refuse politely",
    frame: "I'd rather ___ because ___.",
    meaning: "我更愿意……，因为……",
    world: "Plans · invitations · course selection · food",
    rule: "would rather + base verb (never ‘to’)",
    unlockAt: 2500,
    examples: [
      "I'd rather meet after school because I have a class at lunch.",
      "I'd rather take biology because it fits my long-term goals.",
      "I'd rather stay in tonight because I have an early start tomorrow.",
    ],
    substitutions: [
      { cue: "更愿意放学后见；午餐时有课。", answer: "I'd rather meet after school because I have a class at lunch.", transferCue: "更愿意周五 rehearse；周四有预约。", transferAnswer: "I'd rather rehearse on Friday because I have an appointment on Thursday." },
      { cue: "更愿意选生物；符合长期目标。", answer: "I'd rather take biology because it fits my long-term goals.", transferCue: "更愿意选 morning class；下午要训练。", transferAnswer: "I'd rather take the morning class because I have practice in the afternoon." },
      { cue: "更愿意今晚待家；明天早起。", answer: "I'd rather stay in tonight because I have an early start tomorrow.", transferCue: "更愿意打包带走；公交马上来。", transferAnswer: "I'd rather get it to go because my bus is coming soon." },
    ],
    transformations: [
      { cue: "Correct the error: I'd rather to study at home.", answer: "I'd rather study at home.", transferCue: "Correct: I'd rather to meet at five.", transferAnswer: "I'd rather meet at five." },
      { cue: "Make more diplomatic: I don't want to go there.", answer: "I'd rather go somewhere quieter because I need to study later.", transferCue: "Make more diplomatic: I don't want chemistry.", transferAnswer: "I'd rather take biology because it fits my goals better." },
    ],
    responses: [
      { cue: "Friend: Do you want to go out tonight?", answer: "I'd rather stay in tonight because I have a presentation tomorrow.", transferCue: "Teammate: Should we meet at lunch?", transferAnswer: "I'd rather meet after school because I have a class at lunch." },
      { cue: "Counsellor: Would you prefer physics or biology?", answer: "I'd rather take biology because it connects more closely to health science.", transferCue: "Server: Would you like fries or salad?", transferAnswer: "I'd rather have salad because I want something lighter." },
    ],
    situations: [
      { cue: "礼貌拒绝邀请，同时给替代时间。", answer: "I'd rather not go out tonight because I have a deadline, but I'd be happy to meet tomorrow afternoon.", transferCue: "与同学协商 meeting time。", transferAnswer: "I'd rather meet after school because lunch is too short. Would four o'clock work?" },
      { cue: "和 counsellor 比较两门课程并做选择。", answer: "I'd rather take biology because it fits my long-term goals and works better with my timetable.", transferCue: "在餐厅选择更合适的食物。", transferAnswer: "I'd rather order the soup because I want something warm and it doesn't contain nuts." },
    ],
    boss: { cue: "FINAL BOSS：60 秒做三个选择，每次给不同理由，并礼貌拒绝一个邀请。", answer: "I'd rather take biology because it fits my goals. I'd rather study at the library because it's quieter. I'd rather not go out tonight because I need to finish my assignment.", transferCue: "TRANSFER：换成旅行、餐厅和 group project。", transferAnswer: "I'd rather take the train because it's more reliable." },
  },
  {
    id: "about-to-when",
    level: 8,
    cefr: "B2",
    title: "Tell interrupted stories",
    frame: "I was about to ___ when ___.",
    meaning: "我正准备……，这时……",
    world: "Stories · interruptions · unexpected events",
    rule: "was about to + base verb · when + past event",
    unlockAt: 2900,
    examples: [
      "I was about to leave when my teacher asked to speak with me.",
      "I was about to submit the file when my laptop froze.",
      "I was about to get on the bus when I realized I'd forgotten my pass.",
    ],
    substitutions: [
      { cue: "正准备离开；老师叫住你。", answer: "I was about to leave when my teacher asked to speak with me.", transferCue: "正准备吃午饭；counsellor 打电话。", transferAnswer: "I was about to eat lunch when my guidance counsellor called." },
      { cue: "正准备提交文件；电脑死机。", answer: "I was about to submit the file when my laptop froze.", transferCue: "正准备开始 presentation；投影仪坏了。", transferAnswer: "I was about to start the presentation when the projector stopped working." },
      { cue: "正准备上公交；发现忘了 pass。", answer: "I was about to get on the bus when I realized I'd forgotten my pass.", transferCue: "正准备付款；发现钱包不见了。", transferAnswer: "I was about to pay when I realized my wallet was missing." },
    ],
    transformations: [
      { cue: "Combine: I almost left. Then my phone rang.", answer: "I was about to leave when my phone rang.", transferCue: "Combine: I almost spoke. Then the bell rang.", transferAnswer: "I was about to speak when the bell rang." },
      { cue: "Change I to we.", answer: "We were about to begin when the fire alarm went off.", transferCue: "Change we to she.", transferAnswer: "She was about to answer when the teacher called on someone else." },
    ],
    responses: [
      { cue: "Friend: Why didn't you submit it?", answer: "I was about to submit it when the school portal went down.", transferCue: "Teacher: Why did you stop the presentation?", transferAnswer: "I was about to show the video when the projector stopped working." },
      { cue: "Homestay parent: What happened at the bus stop?", answer: "I was about to get on the bus when I realized I'd left my pass at home.", transferCue: "Doctor: When did the headache start?", transferAnswer: "I was about to go to class when I suddenly got a severe headache." },
    ],
    situations: [
      { cue: "讲一个 school technology failure story。", answer: "I was about to submit my assignment when the portal went down. I was about to email my teacher when the site started working again.", transferCue: "讲一个 missed-bus story。", transferAnswer: "I was about to get on the bus when I realized I'd forgotten my pass, so I had to go back home." },
      { cue: "讲一个 presentation interruption。", answer: "I was about to start my final slide when the fire alarm went off. We waited outside and finished later.", transferCue: "讲一个 clinic interruption。", transferAnswer: "I was about to leave the clinic when the doctor asked me one more question." },
    ],
    boss: { cue: "FINAL BOSS：讲 60 秒 unexpected-event story，使用两次目标句型和自然结尾。", answer: "I was about to leave for school when I got an urgent visa email. Later, I was about to catch the bus when I realized I'd forgotten my pass. In the end, I took a taxi and arrived just on time.", transferCue: "TRANSFER：换成 classroom story。", transferAnswer: "I was about to answer when the bell rang." },
  },
  {
    id: "what-i-mean",
    level: 9,
    cefr: "B2",
    title: "Repair your meaning",
    frame: "What I mean is ___.",
    meaning: "我的意思是……",
    world: "Clarification · opinions · presentations",
    rule: "state the corrected meaning as a complete clause",
    unlockAt: 3350,
    examples: [
      "What I mean is that I need more time, not less work.",
      "What I mean is that the idea is good, but the timing is difficult.",
      "What I mean is that I understood the topic, but not the instructions.",
    ],
    substitutions: [
      { cue: "不是想少做，而是需要更多时间。", answer: "What I mean is that I need more time, not less work.", transferCue: "不是不喜欢课程，而是 timetable 不合适。", transferAnswer: "What I mean is that I like the course, but the timetable doesn't work for me." },
      { cue: "想法不错，但时机困难。", answer: "What I mean is that the idea is good, but the timing is difficult.", transferCue: "presentation 内容不错，但太长。", transferAnswer: "What I mean is that the presentation is good, but it's too long." },
      { cue: "懂 topic，但没懂 instructions。", answer: "What I mean is that I understood the topic, but not the instructions.", transferCue: "听到了日期，但没听到时间。", transferAnswer: "What I mean is that I heard the date, but not the time." },
    ],
    transformations: [
      { cue: "Repair: I don't want to work. (You need a later deadline.)", answer: "What I mean is that I need a later deadline, not that I don't want to work.", transferCue: "Repair: The class is bad. (It moves too quickly.)", transferAnswer: "What I mean is that the class moves too quickly, not that it's bad." },
      { cue: "Add contrast with but.", answer: "What I mean is that I can attend the meeting, but I might be ten minutes late.", transferCue: "Add not X, but Y.", transferAnswer: "What I mean is that I need clarification, not a different assignment." },
    ],
    responses: [
      { cue: "Teacher: Are you saying the assignment is too hard?", answer: "What I mean is that I understand the topic, but I need clarification on the format.", transferCue: "Friend: Are you saying you don't want to come?", transferAnswer: "What I mean is that I want to come, but I can't stay very long." },
      { cue: "Teammate: Do you think my idea is bad?", answer: "What I mean is that the idea is good, but we may not have enough time for it.", transferCue: "Counsellor: Do you dislike the course?", transferAnswer: "What I mean is that I like the course, but it conflicts with my timetable." },
    ],
    situations: [
      { cue: "课堂误解：老师误以为你想少做作业。澄清真正意思。", answer: "What I mean is that I need a little more time, not that I want less work. I want to complete the assignment properly.", transferCue: "Group project：同伴误以为你反对他的 idea。", transferAnswer: "What I mean is that I like the idea, but I think we need a simpler version." },
      { cue: "Course selection：counsellor 误解你的目标。", answer: "What I mean is that I want a challenging course, but I also need one that fits my timetable.", transferCue: "Homestay：解释你不是不喜欢食物，而是有 allergy。", transferAnswer: "What I mean is that the food looks great, but I can't eat nuts because I have an allergy." },
    ],
    boss: { cue: "FINAL BOSS：完成 60 秒 misunderstanding repair。澄清、举例、确认对方理解。", answer: "What I mean is that I can do the project, but I need more time for the research. For example, the sources aren't available yet. Does that make sense?", transferCue: "TRANSFER：换成 homestay misunderstanding。", transferAnswer: "What I mean is that I'm not avoiding dinner; I just have practice after school." },
  },
  {
    id: "like-to-know",
    level: 10,
    cefr: "B2",
    title: "Ask formal school questions",
    frame: "I'd like to know whether ___.",
    meaning: "我想了解是否……",
    world: "Guidance counsellor · course selection · school office",
    rule: "whether + statement word order (no question inversion)",
    unlockAt: 3850,
    examples: [
      "I'd like to know whether this course is required for graduation.",
      "I'd like to know whether I can change classes after the deadline.",
      "I'd like to know whether the school offers extra language support.",
    ],
    substitutions: [
      { cue: "想知道课程是否毕业必修。", answer: "I'd like to know whether this course is required for graduation.", transferCue: "想知道学分是否可以转移。", transferAnswer: "I'd like to know whether these credits can be transferred." },
      { cue: "想知道 deadline 后能否换课。", answer: "I'd like to know whether I can change classes after the deadline.", transferCue: "想知道能否加入 waiting list。", transferAnswer: "I'd like to know whether I can join the waiting list." },
      { cue: "想知道学校是否提供额外语言支持。", answer: "I'd like to know whether the school offers extra language support.", transferCue: "想知道 library 周末是否开放。", transferAnswer: "I'd like to know whether the library is open on weekends." },
    ],
    transformations: [
      { cue: "Make formal: Can I drop this class?", answer: "I'd like to know whether I can drop this class.", transferCue: "Make formal: Is physics required?", transferAnswer: "I'd like to know whether physics is required." },
      { cue: "Correct word order: whether can I change classes.", answer: "I'd like to know whether I can change classes.", transferCue: "Correct: whether is the library open.", transferAnswer: "I'd like to know whether the library is open." },
    ],
    responses: [
      { cue: "Counsellor: What would you like to ask?", answer: "I'd like to know whether biology is required for the health-science program.", transferCue: "School office: How can I help?", transferAnswer: "I'd like to know whether I need to bring any other documents." },
      { cue: "Teacher: Do you have a question about the assignment?", answer: "I'd like to know whether we can use outside sources.", transferCue: "Coach: Any questions about tryouts?", transferAnswer: "I'd like to know whether I need to register in advance." },
    ],
    situations: [
      { cue: "Guidance counsellor meeting：问三项 course-selection 问题。", answer: "I'd like to know whether physics is required, whether this class fits my timetable, and whether I can change courses later.", transferCue: "School office：问 registration 和 documents。", transferAnswer: "I'd like to know whether my registration is complete and whether you need any other documents." },
      { cue: "Teacher office hour：询问 deadline、format、resubmission。", answer: "I'd like to know whether the deadline is Friday, whether we need a printed copy, and whether revisions are allowed.", transferCue: "Club signup：询问 meeting、fee、experience。", transferAnswer: "I'd like to know whether the club meets weekly and whether beginners can join." },
    ],
    boss: { cue: "FINAL BOSS：模拟 60 秒 guidance-counsellor appointment，问四个有逻辑的 follow-up questions。", answer: "I'd like to know whether biology is required for graduation. I'd also like to know whether it fits my timetable and whether I can switch sections later.", transferCue: "TRANSFER：换成 school office registration。", transferAnswer: "I'd like to know whether my documents have arrived." },
  },
  {
    id: "if-had",
    level: 11,
    cefr: "B2",
    title: "Reflect on past choices",
    frame: "If I had ___, I would have ___.",
    meaning: "如果当时……，我本来就会……",
    world: "Reflection · advice · mistakes · study strategy",
    rule: "if + had + past participle · would have + past participle",
    unlockAt: 4400,
    examples: [
      "If I had checked the timetable, I would have noticed the conflict.",
      "If I had left earlier, I would have caught the school bus.",
      "If I had practiced more, I would have felt calmer during the presentation.",
    ],
    substitutions: [
      { cue: "如果查过 timetable，就会注意到冲突。", answer: "If I had checked the timetable, I would have noticed the conflict.", transferCue: "如果读过 email，就会知道教室变了。", transferAnswer: "If I had read the email, I would have known the room had changed." },
      { cue: "如果早点出门，就会赶上校车。", answer: "If I had left earlier, I would have caught the school bus.", transferCue: "如果带了 pass，就不必叫 taxi。", transferAnswer: "If I had brought my pass, I wouldn't have needed to call a taxi." },
      { cue: "如果多练习，就会 presentation 时更冷静。", answer: "If I had practiced more, I would have felt calmer during the presentation.", transferCue: "如果先做 outline，就会写得更快。", transferAnswer: "If I had made an outline first, I would have written faster." },
    ],
    transformations: [
      { cue: "Combine: I didn't check. I missed the conflict.", answer: "If I had checked, I would have noticed the conflict.", transferCue: "Combine: I didn't ask. I stayed confused.", transferAnswer: "If I had asked, I would have understood." },
      { cue: "Make negative result: bring umbrella / not get wet.", answer: "If I had brought an umbrella, I wouldn't have gotten wet.", transferCue: "study map / not get lost.", transferAnswer: "If I had checked the map, I wouldn't have gotten lost." },
    ],
    responses: [
      { cue: "Friend: What would you have done differently?", answer: "If I had started earlier, I would have finished before the deadline.", transferCue: "Teacher: How could you have prepared better?", transferAnswer: "If I had rehearsed with my group, I would have felt more confident." },
      { cue: "Counsellor: How could you have avoided the conflict?", answer: "If I had checked both course times, I would have noticed the conflict.", transferCue: "Homestay parent: How could you have caught the bus?", transferAnswer: "If I had left ten minutes earlier, I would have caught it." },
    ],
    situations: [
      { cue: "反思一次 missed deadline，给三条具体 hindsight。", answer: "If I had checked the portal earlier, I would have seen the problem. If I had emailed my teacher, I would have gotten help.", transferCue: "反思一次 presentation。", transferAnswer: "If I had rehearsed more, I would have spoken more clearly." },
      { cue: "给新学生 transit advice，用自己的错误说明。", answer: "If I had downloaded the transit app, I would have known about the delay. If I had left earlier, I would have arrived on time.", transferCue: "给新学生 course-selection advice。", transferAnswer: "If I had talked to the counsellor earlier, I would have chosen a better timetable." },
    ],
    boss: { cue: "FINAL BOSS：60 秒复盘一个真实错误，用三次第三条件句并说下一步。", answer: "If I had started earlier, I would have had more time. If I had asked for help, I would have solved the problem faster. Next time, I'll act sooner.", transferCue: "TRANSFER：换成 Canada school scenario。", transferAnswer: "If I had checked the timetable, I would have noticed the room change." },
  },
  {
    id: "not-only",
    level: 12,
    cefr: "B2",
    title: "Build a stronger point",
    frame: "Not only ___, but ___.",
    meaning: "不仅……，而且……",
    world: "Presentations · arguments · academic speaking",
    rule: "keep both sides parallel and easy to say",
    unlockAt: 5000,
    examples: [
      "This plan not only saves time, but also makes the workload fairer.",
      "The club not only helped me make friends, but also improved my confidence.",
      "Public transit is not only cheaper, but also better for the environment.",
    ],
    substitutions: [
      { cue: "计划既省时间，也让工作量更公平。", answer: "This plan not only saves time, but also makes the workload fairer.", transferCue: "彩排既发现错误，也增强信心。", transferAnswer: "Rehearsing not only helps us catch mistakes, but also builds our confidence." },
      { cue: "club 既帮你交朋友，也提高信心。", answer: "The club not only helped me make friends, but also improved my confidence.", transferCue: "group project 既练口语，也练团队合作。", transferAnswer: "The group project not only improved my speaking, but also taught me how to work with others." },
      { cue: "公交既便宜，也更环保。", answer: "Public transit is not only cheaper, but also better for the environment.", transferCue: "这个 course 既实用，也满足 graduation requirement。", transferAnswer: "This course is not only practical, but also required for graduation." },
    ],
    transformations: [
      { cue: "Combine parallel verbs: saves time + reduces stress.", answer: "It not only saves time, but also reduces stress.", transferCue: "Combine adjectives: useful + easy to access.", transferAnswer: "It is not only useful, but also easy to access." },
      { cue: "Fix parallelism: not only helped me learn, but also my confidence improved.", answer: "It not only helped me learn, but also improved my confidence.", transferCue: "Fix: not only cheaper, but also it is faster.", transferAnswer: "It is not only cheaper, but also faster." },
    ],
    responses: [
      { cue: "Teacher: Why is your proposal useful?", answer: "It not only saves time, but also gives every group member a clear role.", transferCue: "Counsellor: Why do you want this course?", transferAnswer: "It not only fits my timetable, but also supports my long-term goals." },
      { cue: "Classmate: Why join the club?", answer: "It not only helps you make friends, but also gives you a chance to practice English.", transferCue: "Friend: Why use public transit?", transferAnswer: "It's not only cheaper, but also more convenient downtown." },
    ],
    situations: [
      { cue: "Presentation：用目标句型给出三个支持学校新计划的论点。", answer: "The plan not only gives students more choices, but also makes support easier to access. It not only saves time, but also reduces stress.", transferCue: "Debate：支持 public transit。", transferAnswer: "Public transit is not only cheaper, but also better for the environment." },
      { cue: "Course selection：解释一门课的多重价值。", answer: "Biology not only supports my career goals, but also meets a graduation requirement.", transferCue: "Club fair：推荐一个 club。", transferAnswer: "The club not only helps students make friends, but also builds leadership skills." },
    ],
    boss: { cue: "FINAL BOSS：做 75 秒 mini-presentation。开场、三个 parallel points、结论。", answer: "Our plan is practical. It not only saves time, but also makes the workload fairer. It not only improves communication, but also reduces last-minute stress.", transferCue: "TRANSFER：换成 ‘Why join a school club?’。", transferAnswer: "A school club not only helps you make friends, but also gives you real speaking practice." },
  },
];

function makeSeed(answer: string, index: number): DrillSeed {
  return {
    cue: "Listen to the model. Copy its stress, linking, and rhythm.",
    answer,
    transferCue: "Say the same idea from memory—no text support.",
    transferAnswer: answer,
    hint: index === 0 ? "Listen for the whole thought group first." : "Keep function words light; stress the changed result.",
    tags: ["pronunciation", "fluency"],
  };
}

export function buildSession(pattern: PatternDefinition, weakPoints: Record<WeakPoint, number>): DrillPrompt[] {
  const prompts: DrillPrompt[] = [];
  const warmupCue = pattern.id === "focused-on"
    ? `What are you focused on today? Use “${pattern.frame}” at least twice.`
    : pattern.id === "supposed-ended"
      ? `What were you supposed to do yesterday, and what did you end up doing? Use “${pattern.frame}” at least twice.`
      : pattern.id === "didnt-catch"
        ? `Describe one thing you did not understand recently and how you asked for help. Use “${pattern.frame}”.`
        : `Give a true two-minute update from your life. Use “${pattern.frame}” at least twice.`;
  prompts.push({
    id: `${pattern.id}-warmup`,
    stageId: "warmup",
    level: 1,
    kind: "Voice diary",
    instruction: "Speak for 2 minutes. Use today’s pattern at least twice. No script.",
    cue: warmupCue,
    answer: pattern.examples[0],
    transferCue: "Add one more true example from your day.",
    transferAnswer: pattern.examples[1],
    hint: "The goal is flow, not a perfect diary.",
    tags: ["fluency"],
    openAnswer: true,
  });

  pattern.examples.forEach((answer, index) => {
    prompts.push({
      ...makeSeed(answer, index),
      id: `${pattern.id}-lock-${index}`,
      stageId: "lock",
      level: 1,
      kind: index === 2 ? "Backward build-up" : index === 0 ? "Dialogue & meaning" : "Repetition drill",
      instruction: index === 0 ? "Listen for meaning first. Then mimic the full line." : index === 2 ? "Build the line from the end, then say it whole." : "Mimic the model. Match the rhythm, not just the words.",
    });
  });

  pattern.substitutions.forEach((seed, index) => {
    prompts.push({
      ...seed,
      id: `${pattern.id}-sub-${index}`,
      stageId: "reaction",
      level: 2,
      kind: "Substitution drill",
      instruction: "Keep the pattern locked. Replace only the meaning slots.",
      tags: seed.tags ?? ["grammar", "speed"],
    });
  });

  pattern.transformations.forEach((seed, index) => {
    prompts.push({
      ...seed,
      id: `${pattern.id}-transform-${index}`,
      stageId: "transform",
      level: index + 3,
      kind: "Transformation drill",
      instruction: "Change the form and answer as one natural sentence.",
      tags: seed.tags ?? ["grammar"],
    });
  });

  pattern.responses.forEach((seed, index) => {
    prompts.push({
      ...seed,
      id: `${pattern.id}-response-${index}`,
      stageId: "speed",
      level: index + 4,
      kind: index % 2 === 0 ? "Response drill" : "Question & answer",
      instruction: "Answer the speaker within 3 seconds. Keep it conversational.",
      tags: seed.tags ?? ["speed", "fluency"],
    });
  });

  pattern.situations.forEach((seed, index) => {
    prompts.push({
      ...seed,
      id: `${pattern.id}-situation-${index}`,
      stageId: "real",
      level: index + 5,
      kind: index % 2 === 0 ? "Expansion drill" : "Situation drill",
      instruction: "Expand the core pattern with a reason, detail, or next step.",
      tags: seed.tags ?? ["fluency", "vocabulary"],
      openAnswer: true,
    });
  });

  const topWeakPoint = (Object.entries(weakPoints) as Array<[WeakPoint, number]>)
    .sort((a, b) => b[1] - a[1])[0];
  if (topWeakPoint && topWeakPoint[1] > 0) {
    const source =
      topWeakPoint[0] === "grammar"
        ? pattern.transformations[0]
        : topWeakPoint[0] === "speed"
          ? pattern.responses[0]
          : topWeakPoint[0] === "pronunciation"
            ? makeSeed(pattern.examples[0], 0)
            : pattern.situations[0];
    prompts.push({
      ...source,
      id: `${pattern.id}-micro-${topWeakPoint[0]}`,
      stageId: topWeakPoint[0] === "grammar" ? "transform" : topWeakPoint[0] === "speed" ? "speed" : "real",
      level: 6,
      kind: topWeakPoint[0] === "grammar" ? "Transformation drill" : topWeakPoint[0] === "speed" ? "Response drill" : "Expansion drill",
      instruction: `MICRO DRILL · Your ${topWeakPoint[0]} weak point is being retrained now.`,
      tags: [topWeakPoint[0]],
    });
  }

  prompts.push({
    ...pattern.boss,
    id: `${pattern.id}-boss`,
    stageId: "boss",
    level: 7,
    kind: "Recombination",
    instruction: "No script. Recombine familiar chunks into your own response.",
    tags: pattern.boss.tags ?? ["fluency", "speed"],
    openAnswer: true,
  });

  return prompts.sort((a, b) => stages.findIndex((stage) => stage.id === a.stageId) - stages.findIndex((stage) => stage.id === b.stageId));
}

export function buildBackward(text: string) {
  const clean = text.replace(/[“”‘’]/g, "").trim();
  const words = clean.split(/\s+/);
  return [2, 4, 7, 11, words.length]
    .map((size) => words.slice(Math.max(0, words.length - size)).join(" "))
    .filter((line, index, array) => line && array.indexOf(line) === index);
}

export function normalizeSpeech(text: string) {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function evaluateSpeech(transcript: string, expected: string, patternId: string) {
  const heard = normalizeSpeech(transcript);
  const model = normalizeSpeech(expected);
  if (!heard) return { score: 0, issue: "No speech was detected. Use self-grade or try the mic again." };
  const heardWords = new Set(heard.split(" "));
  const modelWords = model.split(" ");
  const overlap = modelWords.filter((word) => heardWords.has(word)).length / Math.max(1, modelWords.length);
  let issue = "The message is close. Compare the model and repair the missing chunk.";
  let framePenalty = 0;
  if (patternId === "supposed-ended") {
    if (!heard.includes("supposed to")) {
      issue = "Missing chunk: supposed to + base verb.";
      framePenalty += 0.18;
    } else if (!heard.includes("ended up")) {
      issue = "Missing chunk: ended up + verb-ing.";
      framePenalty += 0.18;
    } else {
      const ending = heard.split("ended up")[1]?.trim().split(" ")[0] ?? "";
      if (ending && !ending.endsWith("ing") && ending !== "not") {
        issue = "After ended up, use verb-ing: ended up staying / missing / working.";
        framePenalty += 0.16;
      }
    }
  }
  const score = Math.max(0, Math.min(1, overlap - framePenalty));
  if (score >= 0.84) issue = "Pattern, meaning, and key chunks matched the model.";
  return { score, issue };
}
