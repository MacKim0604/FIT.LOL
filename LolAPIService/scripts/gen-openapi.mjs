import swaggerJSDoc from 'swagger-jsdoc';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine project root: assume script is in <root>/scripts/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Simple CLI arg parser (no extra deps)
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv);

// Defaults (can be overridden by args or env)
let pkgVersion = '1.0.0';
try {
  const pkgJson = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
  if (pkgJson?.version) pkgVersion = pkgJson.version;
} catch {}

const title = args.title || process.env.OPENAPI_TITLE || 'FIT.LOL LolAPIService';
const version = args.version || process.env.OPENAPI_VERSION || pkgVersion;
const serverUrl = args.server || process.env.OPENAPI_SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;
const outPath = path.isAbsolute(args.out || '')
  ? args.out
  : path.join(projectRoot, args.out || 'openapi.json');

// API source patterns
const defaultApis = ['src/**/*.js', 'src/**/*.ts'];
const apisArg = args.apis || process.env.OPENAPI_APIS; // comma-separated
const apis = (apisArg ? apisArg.split(',') : defaultApis)
  .map(s => s.trim())
  .filter(Boolean)
  .map(g => (path.isAbsolute(g) ? g : path.join(projectRoot, g)));

// Build swagger spec
const spec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title,
      version,
      description: args.desc || process.env.OPENAPI_DESCRIPTION || 'Riot API proxy with OIDC auth',
    },
    servers: [{ url: serverUrl }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis,
});

// Ensure output directory exists
mkdirSync(path.dirname(outPath), { recursive: true });

// Write file
writeFileSync(outPath, JSON.stringify(spec, null, 2));

const pathCount = Object.keys(spec.paths || {}).length;
console.log(`✅ openapi.json generated at: ${outPath} (paths: ${pathCount})`);
