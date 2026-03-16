const fs = require('fs').promises;
const path = require('path');

const CURRICULUM_ROOT = path.resolve(__dirname, '..', '..', 'robovotech-curriculum');

const EMBEDDED_CURRICULUM = {
  source: 'embedded',
  overview: {
    title: 'AI-Augmented Robotics & Automation Technician Certification',
    organization: 'Good Samaritan Institute',
    duration: '12 weeks',
    totalHours: 120,
    deliveryModel: '40% in-person lab / 60% self-paced online',
    pricingNote: 'All courses are free to access. Learners pay only when they are ready to sit for certification testing.',
    audience: 'Career changers, veterans, recent graduates, and youth ages 16+',
    salaryRange: '$46K–$56K entry level'
  },
  counts: {
    coreModules: 7,
    lessons: 0,
    labs: 0,
    assessments: 0,
    guides: 0,
    catalogItems: 0
  },
  coreCertification: {
    id: 'core-certification',
    title: 'Core Certification',
    duration: '12 weeks',
    totalHours: 120,
    counts: {
      lessons: 0,
      labs: 0,
      assessments: 0,
      guides: 0
    },
    modules: [
      { id: 'module-01-foundations-and-safety', title: 'Foundations & Safety Orientation', hours: 20, schedule: 'Weeks 1–2', delivery: '8 hrs lab / 12 hrs online', lessons: [], labs: [], assessments: [], instructorGuides: [], counts: { lessons: 0, labs: 0, assessments: 0, guides: 0 } },
      { id: 'module-02-industrial-safety-certification', title: 'Industrial Safety Certification', hours: 16, schedule: 'Weeks 3–4', delivery: '6 hrs lab / 10 hrs online', lessons: [], labs: [], assessments: [], instructorGuides: [], counts: { lessons: 0, labs: 0, assessments: 0, guides: 0 } },
      { id: 'module-03-robot-fundamentals-and-ros2', title: 'Robot Fundamentals & ROS 2 Operations', hours: 20, schedule: 'Weeks 5–6', delivery: '10 hrs lab / 10 hrs online', lessons: [], labs: [], assessments: [], instructorGuides: [], counts: { lessons: 0, labs: 0, assessments: 0, guides: 0 } },
      { id: 'module-04-hardware-integration-and-plcs', title: 'Hardware Integration & PLCs', hours: 16, schedule: 'Weeks 7–8', delivery: '10 hrs lab / 6 hrs online', lessons: [], labs: [], assessments: [], instructorGuides: [], counts: { lessons: 0, labs: 0, assessments: 0, guides: 0 } },
      { id: 'module-05-computer-vision-and-navigation', title: 'Computer Vision & Navigation', hours: 16, schedule: 'Weeks 9–10', delivery: '8 hrs lab / 8 hrs online', lessons: [], labs: [], assessments: [], instructorGuides: [], counts: { lessons: 0, labs: 0, assessments: 0, guides: 0 } },
      { id: 'module-06-edge-deployment-and-mlops', title: 'Edge Deployment & MLOps', hours: 8, schedule: 'Week 11', delivery: '4 hrs lab / 4 hrs online', lessons: [], labs: [], assessments: [], instructorGuides: [], counts: { lessons: 0, labs: 0, assessments: 0, guides: 0 } },
      { id: 'module-07-capstone-industry-project', title: 'Capstone — Industry 4.0 Project', hours: 12, schedule: 'Week 12', delivery: '10 hrs lab / 2 hrs online + distributed prep', lessons: [], labs: [], assessments: [], instructorGuides: [], counts: { lessons: 0, labs: 0, assessments: 0, guides: 0 } }
    ]
  },
  youthTrack: {
    id: 'youth-track',
    title: 'Introduction to Robotics & AI',
    subtitle: 'Ages 16–18',
    totalHours: 60,
    duration: '8 weeks',
    deliveryModel: '50% lab / 50% online',
    credential: 'RoboVoTech Youth Certificate of Completion',
    modules: [
      { id: 'y1', code: 'Y1', title: 'Welcome to Robotics', hours: 8, weeks: '1' },
      { id: 'y2', code: 'Y2', title: 'Programming Your Robot', hours: 8, weeks: '2–3' },
      { id: 'y3', code: 'Y3', title: 'Robot Intelligence — Introduction to AI', hours: 8, weeks: '3–4' },
      { id: 'y4', code: 'Y4', title: 'Building Autonomous Robots', hours: 8, weeks: '5–6' },
      { id: 'y5', code: 'Y5', title: '3D Printing & Robot Design', hours: 6, weeks: '6' },
      { id: 'y6', code: 'Y6', title: 'Drones & Aerial Robotics', hours: 6, weeks: '7' },
      { id: 'y7', code: 'Y7', title: 'Youth Capstone & Showcase', hours: 8, weeks: '8' }
    ]
  },
  microCredentials: [
    { id: 'mc-industrial-safety', code: 'MC-01', title: 'Industrial Safety for Robotics', hours: 20, composedOf: 'Module 2 + Lessons 1.1 and 1.2', value: 'Entry to robotics labs and manufacturing floors' },
    { id: 'mc-ros2-operator', code: 'MC-02', title: 'ROS 2 Robot Operator', hours: 24, composedOf: 'Module 3 + Lesson 1.5', value: 'Operate, configure, and troubleshoot ROS 2 robot systems' },
    { id: 'mc-plc-fundamentals', code: 'MC-03', title: 'PLC & Hardware Integration', hours: 20, composedOf: 'Module 4 + Lesson 1.4', value: 'Read ladder logic and configure industrial communication' },
    { id: 'mc-computer-vision', code: 'MC-04', title: 'Computer Vision for Industrial Robotics', hours: 20, composedOf: 'Module 5 + Lesson 1.5', value: 'Deploy AI-powered visual inspection and object detection systems' },
    { id: 'mc-edge-ai-deployment', code: 'MC-05', title: 'Edge AI Deployment', hours: 12, composedOf: 'Module 6 + Lesson 1.5', value: 'Containerize and deploy AI models to edge hardware' }
  ],
  advancedPathways: [
    { id: 'advanced-robotics-specialist', code: 'AP-01', title: 'Advanced Robotics Specialist', totalHours: 80, salaryRange: '$71K–$95K', modules: [] },
    { id: 'automation-systems-integrator', code: 'AP-02', title: 'Automation Systems Integrator', totalHours: 80, salaryRange: '$75K–$105K', modules: [] }
  ],
  sharedResources: [],
  techStack: [
    'ROS 2 Jazzy',
    'Gazebo Harmonic',
    'YOLO11',
    'OpenCV',
    'Jetson Orin Nano Super',
    'TensorRT',
    'Docker',
    'AWS IoT Greengrass',
    'Arduino',
    'Raspberry Pi',
    'PLCs',
    'Nav2'
  ]
};

let cachedCurriculum = null;

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseMarkdownTable(markdown) {
  const lines = markdown.split('\n');
  const startIndex = lines.findIndex((line) => line.trim().startsWith('|'));

  if (startIndex === -1 || !lines[startIndex + 1] || !lines[startIndex + 1].includes('---')) {
    return [];
  }

  const headers = lines[startIndex]
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean);

  const rows = [];

  for (let index = startIndex + 2; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line.startsWith('|')) {
      break;
    }

    const cells = line
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean);

    if (cells.length !== headers.length) {
      continue;
    }

    rows.push(headers.reduce((accumulator, header, cellIndex) => {
      accumulator[header] = cells[cellIndex];
      return accumulator;
    }, {}));
  }

  return rows;
}

function extractField(markdown, label) {
  const match = markdown.match(new RegExp(`- \\*\\*${label}:\\*\\*\\s+(.+)`));
  if (match) {
    return match[1].trim();
  }

  const boldLineMatch = markdown.match(new RegExp(`\\*\\*${label}:\\*\\*\\s+(.+)`));
  return boldLineMatch ? boldLineMatch[1].trim() : '';
}

function splitHeading(heading, fallbackType = '') {
  const match = String(heading || '').match(/^([^:]+):\s+(.+)$/);
  if (!match) {
    return {
      code: fallbackType,
      title: String(heading || '').trim()
    };
  }

  return {
    code: match[1].trim(),
    title: match[2].trim()
  };
}

function normalizeFilename(filePath) {
  return path.basename(filePath, '.md')
    .replace(/^[a-z]+-\d+-\d+-/i, '')
    .replace(/^guide-module-\d+-/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function extractExcerpt(markdown) {
  const lines = markdown.split('\n');
  const excerptLines = [];
  let inCodeBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    if (!line || line === '---' || line.startsWith('#') || line.startsWith('|')) {
      if (excerptLines.length) {
        break;
      }
      continue;
    }

    if (line.startsWith('- **') || line.startsWith('**') || line.startsWith('- [') || line.startsWith('###')) {
      continue;
    }

    excerptLines.push(line);

    if (excerptLines.join(' ').length >= 220) {
      break;
    }
  }

  return excerptLines.join(' ').slice(0, 240);
}

async function readText(filePath) {
  return fs.readFile(filePath, 'utf8');
}

async function readMarkdownItems(directoryPath, kind) {
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => path.join(directoryPath, entry.name))
      .sort();

    return Promise.all(files.map(async (filePath) => {
      const markdown = await readText(filePath);
      const headingMatch = markdown.match(/^#\s+(.+)$/m);
      const heading = headingMatch ? headingMatch[1].trim() : normalizeFilename(filePath);
      const parts = splitHeading(heading, kind);
      const relativePath = path.relative(CURRICULUM_ROOT, filePath);
      const duration = extractField(markdown, 'Duration') || extractField(markdown, 'Hours') || extractField(markdown, 'Time Allowed');
      const delivery = extractField(markdown, 'Delivery Mode') || extractField(markdown, 'Delivery');
      const week = extractField(markdown, 'Week');
      const prerequisites = extractField(markdown, 'Prerequisites') || extractField(markdown, 'Prerequisite');

      return {
        id: slugify(relativePath),
        kind,
        path: relativePath,
        fileName: path.basename(filePath),
        heading,
        code: parts.code,
        title: parts.title,
        duration,
        delivery,
        week,
        prerequisites,
        excerpt: extractExcerpt(markdown)
      };
    }));
  } catch {
    return [];
  }
}

function summarizeCounts(modules) {
  return modules.reduce((totals, module) => ({
    lessons: totals.lessons + module.counts.lessons,
    labs: totals.labs + module.counts.labs,
    assessments: totals.assessments + module.counts.assessments,
    guides: totals.guides + module.counts.guides
  }), { lessons: 0, labs: 0, assessments: 0, guides: 0 });
}

async function parseCoreCertification(rootDir) {
  const coreDir = path.join(rootDir, 'core-certification');
  const moduleDirs = (await fs.readdir(coreDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const modules = await Promise.all(moduleDirs.map(async (dirName) => {
    const moduleDir = path.join(coreDir, dirName);
    const readme = await readText(path.join(moduleDir, 'README.md'));
    const titleMatch = readme.match(/^#\s+Module\s+\d+:\s+(.+)$/m);
    const hoursMatch = readme.match(/\*\*Hours:\*\*\s+(\d+)\s+\(([^)]+)\)\s+\|\s+\*\*Delivery:\*\*\s+(.+)$/m);
    const outlineLessons = parseMarkdownTable(readme).map((row) => ({
      code: row['#'] || '',
      title: row.Title || '',
      hours: row.Hours || '',
      delivery: row.Delivery || '',
      status: row.Status || ''
    }));

    const [lessons, labs, assessments, instructorGuides] = await Promise.all([
      readMarkdownItems(path.join(moduleDir, 'lessons'), 'lesson'),
      readMarkdownItems(path.join(moduleDir, 'labs'), 'lab'),
      readMarkdownItems(path.join(moduleDir, 'assessments'), 'assessment'),
      readMarkdownItems(path.join(moduleDir, 'instructor-guide'), 'guide')
    ]);

    return {
      id: dirName,
      title: titleMatch ? titleMatch[1].trim() : dirName,
      hours: hoursMatch ? Number.parseInt(hoursMatch[1], 10) : 0,
      schedule: hoursMatch ? hoursMatch[2].trim() : '',
      delivery: hoursMatch ? hoursMatch[3].trim() : '',
      outlineLessons,
      lessons,
      labs,
      assessments,
      instructorGuides,
      counts: {
        lessons: lessons.length,
        labs: labs.length,
        assessments: assessments.length,
        guides: instructorGuides.length
      }
    };
  }));

  const counts = summarizeCounts(modules);

  return {
    id: 'core-certification',
    title: 'Core Certification',
    duration: '12 weeks',
    totalHours: 120,
    counts,
    modules
  };
}

async function parseYouthTrack(rootDir) {
  const readme = await readText(path.join(rootDir, 'youth-track', 'README.md'));
  const hoursMatch = readme.match(/\*\*Hours:\*\*\s+(\d+)\s+\(([^)]+)\)\s+\|\s+\*\*Delivery:\*\*\s+(.+?)\s+\|\s+\*\*Prerequisites:\*\*\s+(.+)$/m);
  const credentialMatch = readme.match(/## Credential\s+([\s\S]*?)\n\n## Articulation/m);
  const modules = parseMarkdownTable(readme).map((row) => ({
    id: slugify(row['#'] || row.Title),
    code: row['#'],
    title: row.Title,
    hours: Number.parseInt(row.Hours, 10) || 0,
    weeks: row.Weeks
  }));

  return {
    id: 'youth-track',
    title: 'Introduction to Robotics & AI',
    subtitle: 'Ages 16–18',
    totalHours: hoursMatch ? Number.parseInt(hoursMatch[1], 10) : 60,
    duration: hoursMatch ? hoursMatch[2] : '8 weeks',
    deliveryModel: hoursMatch ? hoursMatch[3] : '50% lab / 50% online',
    prerequisites: hoursMatch ? hoursMatch[4] : 'High school enrollment',
    credential: credentialMatch ? credentialMatch[1].trim() : 'RoboVoTech Youth Certificate of Completion',
    modules
  };
}

function parseMicroCredentialBlocks(outline) {
  const blocks = outline.match(/## MC-01:[\s\S]*?(?=\n---\n\n# PART 4)/);

  if (!blocks) {
    return [];
  }

  return blocks[0]
    .split('\n## ')
    .map((block, index) => (index === 0 ? block.replace(/^## /, '') : block))
    .map((block) => {
      const lines = block.trim().split('\n');
      const headingMatch = lines[0].match(/^(MC-\d+):\s+(.+?)\s+\((\d+)\s+hours\)$/);

      if (!headingMatch) {
        return null;
      }

      return {
        id: slugify(headingMatch[2]),
        code: headingMatch[1],
        title: headingMatch[2],
        hours: Number.parseInt(headingMatch[3], 10),
        composedOf: extractField(block, 'Composed of'),
        includes: extractField(block, 'Includes'),
        value: extractField(block, 'Standalone Value'),
        alignment: extractField(block, 'External Cert Alignment')
      };
    })
    .filter(Boolean);
}

async function parseAdvancedPathways(rootDir) {
  const advancedDir = path.join(rootDir, 'advanced-pathways');
  const entries = (await fs.readdir(advancedDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return Promise.all(entries.map(async (dirName) => {
    const readme = await readText(path.join(advancedDir, dirName, 'README.md'));
    const titleMatch = readme.match(/^#\s+(AP-\d+):\s+(.+?)\s+\((\d+)\s+hours\)/m);
    const metaMatch = readme.match(/\*\*Prerequisite:\*\*\s+(.+?)\s+\|\s+\*\*Target Salary:\*\*\s+(.+)$/m);
    const modules = parseMarkdownTable(readme).map((row) => ({
      code: row['#'],
      title: row.Title,
      hours: Number.parseInt(row.Hours, 10) || 0
    }));

    return {
      id: dirName,
      code: titleMatch ? titleMatch[1] : dirName.toUpperCase(),
      title: titleMatch ? titleMatch[2] : dirName,
      totalHours: titleMatch ? Number.parseInt(titleMatch[3], 10) : modules.reduce((total, module) => total + module.hours, 0),
      prerequisite: metaMatch ? metaMatch[1] : 'Core Certification',
      salaryRange: metaMatch ? metaMatch[2] : '',
      modules
    };
  }));
}

async function parseSharedResources(rootDir) {
  const resourceGroups = [
    { id: 'certification-crosswalks', title: 'Certification Crosswalks', directory: path.join(rootDir, 'shared-resources', 'certification-crosswalks') },
    { id: 'templates', title: 'Templates', directory: path.join(rootDir, 'shared-resources', 'templates') },
    { id: 'equipment-lists', title: 'Equipment Lists', directory: path.join(rootDir, 'instructor-resources', 'equipment-lists') }
  ];

  return Promise.all(resourceGroups.map(async (group) => {
    const items = await readMarkdownItems(group.directory, 'resource');

    return {
      id: group.id,
      title: group.title,
      items
    };
  }));
}

async function loadCurriculumFromFilesystem() {
  const [outline, coreCertification, youthTrack, advancedPathways, sharedResources] = await Promise.all([
    readText(path.join(CURRICULUM_ROOT, 'CURRICULUM-OUTLINE.md')),
    parseCoreCertification(CURRICULUM_ROOT),
    parseYouthTrack(CURRICULUM_ROOT),
    parseAdvancedPathways(CURRICULUM_ROOT),
    parseSharedResources(CURRICULUM_ROOT)
  ]);

  const microCredentials = parseMicroCredentialBlocks(outline);
  const counts = {
    coreModules: coreCertification.modules.length,
    lessons: coreCertification.counts.lessons,
    labs: coreCertification.counts.labs,
    assessments: coreCertification.counts.assessments,
    guides: coreCertification.counts.guides,
    catalogItems: coreCertification.counts.lessons + coreCertification.counts.labs + coreCertification.counts.assessments + coreCertification.counts.guides
  };

  return {
    source: 'filesystem',
    overview: {
      title: 'AI-Augmented Robotics & Automation Technician Certification',
      organization: 'Good Samaritan Institute',
      duration: '12 weeks',
      totalHours: 120,
      deliveryModel: '40% in-person lab / 60% self-paced online',
      pricingNote: 'All courses are free to access. Learners pay only when they are ready to sit for certification testing.',
      audience: 'Career changers, veterans, recent graduates, and youth ages 16+',
      salaryRange: '$46K–$56K entry level'
    },
    counts,
    coreCertification,
    youthTrack,
    microCredentials,
    advancedPathways,
    sharedResources,
    techStack: EMBEDDED_CURRICULUM.techStack.slice()
  };
}

function buildCertificationProducts(curriculum) {
  const products = [];
  const coreFee = Number.parseInt(process.env.CORE_CERT_TEST_FEE_CENTS || '19900', 10);
  const microFee = Number.parseInt(process.env.MICRO_CERT_TEST_FEE_CENTS || '7900', 10);
  const advancedFee = Number.parseInt(process.env.ADVANCED_CERT_TEST_FEE_CENTS || '14900', 10);

  products.push({
    id: 'core-certification-exam',
    title: 'Core Certification Testing',
    category: 'core',
    feeCents: coreFee,
    hours: curriculum.coreCertification.totalHours,
    description: 'Written and practical assessment for the full 120-hour technician certificate.'
  });

  curriculum.microCredentials.forEach((credential) => {
    products.push({
      id: `${credential.id}-exam`,
      title: `${credential.title} Testing`,
      category: 'micro',
      feeCents: microFee,
      hours: credential.hours,
      description: credential.value
    });
  });

  curriculum.advancedPathways.forEach((pathway) => {
    products.push({
      id: `${pathway.id}-exam`,
      title: `${pathway.title} Testing`,
      category: 'advanced',
      feeCents: advancedFee,
      hours: pathway.totalHours,
      description: `${pathway.title} final assessment for post-certification learners.`
    });
  });

  return products.map((product) => ({
    ...product,
    feeUsd: Number((product.feeCents / 100).toFixed(2))
  }));
}

async function loadCurriculum() {
  if (cachedCurriculum) {
    return cachedCurriculum;
  }

  try {
    cachedCurriculum = await loadCurriculumFromFilesystem();
  } catch {
    cachedCurriculum = EMBEDDED_CURRICULUM;
  }

  return cachedCurriculum;
}

module.exports = {
  buildCertificationProducts,
  loadCurriculum
};
