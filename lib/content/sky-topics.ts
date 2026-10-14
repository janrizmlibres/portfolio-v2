/**
 * The sky's topics, as a star's label names them when it's hovered, and what clicking it asks Tycho. Keyed by the
 * sky's topic keys (`public/sky/stars-pca.json`); several stars share a topic. Hand-written: these stand until the
 * final copy pass. People are named by their role, never by name, and no label names a client's product.
 */
export type Topic = { label: string; ask: string };

export const SKY_TOPICS: Record<string, Topic> = {
  t01: { label: "Yearbook tools", ask: "What tools did he build for The Crusader Yearbook?" },
  t02: { label: "StoreIt", ask: "What is StoreIt?" },
  t03: { label: "CS50 Web", ask: "What did he build in CS50 Web?" },
  t04: { label: "Pong: Re", ask: "Tell me about Pong: Re." },
  t05: { label: "Xavier University", ask: "What did he do at Xavier University?" },
  t06: { label: "People", ask: "Who are the people in his life?" },
  t07: { label: "Bomberman clone", ask: "Tell me about his Bomberman clone." },
  t08: { label: "The thesis paper", ask: "What did his thesis paper find?" },
  t09: { label: "Night School Program", ask: "What is the XU Night School Program?" },
  t10: { label: "Beliefs", ask: "What does he believe about building software?" },
  t11: { label: "AI Web Crawler", ask: "How does the AI Web Crawler work?" },
  t12: { label: "Tolstoy", ask: "What did he do at Tolstoy?" },
  t13: { label: "High school", ask: "Where did he go to high school?" },
  t14: { label: "Janriz", ask: "Who is Janriz?" },
  t15: { label: "Roach Island", ask: "What is Roach Island?" },
  t16: { label: "FlowStack", ask: "Tell me about FlowStack." },
  t17: { label: "Early career", ask: "How did his career start?" },
  t18: { label: "Athena", ask: "Tell me about Athena." },
  t19: { label: "University", ask: "What did he study at university?" },
  t20: { label: "Childhood", ask: "Where did he grow up?" },
  t21: { label: "Elinnov", ask: "What did he do at Elinnov?" },
  t22: { label: "Certifications", ask: "What certifications does he have?" },
  t23: { label: "NSP information system", ask: "Tell me about the NSP information management system." },
  t24: { label: "The Crusader Yearbook", ask: "What did he do at The Crusader Yearbook?" },
  t25: { label: "XFusion", ask: "What is XFusion?" },
  t26: { label: "Knight's Tour", ask: "Tell me about his Knight's Tour project." },
  t27: { label: "Mercado", ask: "Tell me about Mercado." },
  t28: { label: "Cebu", ask: "Where is he based?" },
  t29: { label: "Max Clique", ask: "What is the Max Clique project?" },
  t30: { label: "Interests", ask: "What is he into outside work?" },
  t31: { label: "PulseVR", ask: "What is PulseVR?" },
  t32: { label: "XCEL", ask: "What did he do in XCEL?" },
  t33: { label: "This portfolio", ask: "How is this portfolio built?" },
  t34: { label: "A collaborator", ask: "Who did he build his university projects with?" },
  t35: { label: "Work", ask: "Where has he worked?" },
  t36: { label: "Readability app", ask: "What was his readability research app?" },
  t37: { label: "Sudo Code Camp", ask: "What was Sudo Code Camp?" },
  t38: { label: "Thesis adviser", ask: "Who advised his thesis?" },
  t39: { label: "Science high school", ask: "Where did he go to high school?" },
  t40: { label: "Cagayan de Oro", ask: "What is his connection to Cagayan de Oro?" },
  t41: { label: "Student council", ask: "What did he do in the student council?" },
  t42: { label: "GDSC", ask: "What did he do in GDSC?" },
  t43: { label: "Emergent Echoes", ask: "What is Emergent Echoes?" },
  t44: { label: "LogoLife", ask: "What did he build at LogoLife?" },
};

/** A topic no label was written for still reads as something. */
export const UNNAMED_TOPIC: Topic = { label: "Something he wrote down", ask: "What else has he written down?" };
