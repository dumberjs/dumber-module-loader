const ALTERNATIVE_CSS_EXTS = [
  '.sass',
  '.scss',
  '.less',
  '.styl'
];

const ALTERNATIVE_TEMPLATE_EXTS = [
  '.md',
  '.pug',
  '.haml',
  '.jade',
  '.slim',
  '.slm'
];

const KNOWN_EXTS = [
  '.css',
  ...ALTERNATIVE_CSS_EXTS,
  '.html',
  ...ALTERNATIVE_TEMPLATE_EXTS,
  '.js',
  '.ts',
  '.mjs',
  '.cjs',
  '.json',
  '.json5',
  '.svg',
  '.txt',
  '.wasm',
  '.wasi',
  '.xml',
  '.yml',
  '.yaml'
];

const idMatcher = /^(\S+?!)?(\S+?)\/?$/;

export function cleanPath(path = '') {
  let clean = path.trim();
  if (clean.length && clean[clean.length - 1] === '/') {
    clean = clean.slice(0, -1);
  }
  return clean;
}

export function ext(id = '') {
  let clean = cleanPath(id);

  const parts = clean.split('/');
  const last = parts.pop();
  const dotPos = last.lastIndexOf('.');
  if (dotPos !== -1) {
    const ext = last.slice(dotPos).toLowerCase();
    if (KNOWN_EXTS.indexOf(ext) !== -1) return ext;
  }
  return '';
}

export function parse(id = '') {
  let m = id.trim().match(idMatcher);
  if (!m) throw new Error(`not a vaid module id: "${id}"`);
  let prefix = m[1] || '';
  let bareId = m[2];

  let extname = ext(bareId);

  // remove json! prefix, json module is supported directly.
  if (extname === '.json' && prefix === 'json!') {
    prefix = '';
  }

  // preserve leading '/'
  let parts = bareId.split('/').filter((p, i) => p || i === 0);
  if (parts.length > 1 && parts[0].length && parts[0][0] === '@') {
    let scope = parts.shift();
    parts[0] = scope + '/' + parts[0];
  }

  const partsWithoutInnerDot = [];
  for (let i = 0, len = parts.length; i < len; i++) {
    // remove inner '.'
    if (i == 0 || parts[i] !== '.') {
      partsWithoutInnerDot.push(parts[i]);
    }
  }

  const partsWithMergedDotDot = [];
  for (let i = 0, len = partsWithoutInnerDot.length; i < len; i++) {
    let p = partsWithoutInnerDot[i];
    if (i === 0 || p !== '..') {
      partsWithMergedDotDot.push(p);
    } else {
      // merge verbose '..'
      const previous = partsWithMergedDotDot.pop();
      if (previous === '..') {
        partsWithMergedDotDot.push(previous);
        partsWithMergedDotDot.push(p);
      } else if (previous === '.' || previous === undefined) {
        partsWithMergedDotDot.push(p);
      }
      // if (previous !== '.' || previous !== '..')
      // ignore both previous and current part
    }
  }

  parts = partsWithMergedDotDot;
  bareId = parts.join('/');

  return {
    prefix: prefix,
    bareId: bareId,
    parts: parts,
    ext: extname,
    cleanId: prefix + bareId
  };
}

export function resolveModuleId(baseId, relativeId) {
  let parsedBaseId = parse(baseId);
  let parsed = parse(relativeId);
  if (parsed.bareId[0] !== '.') return parsed.cleanId;

  let parts = parsedBaseId.parts;
  parts.pop();

  parsed.parts.forEach(function (p) {
    if (p === '..') {
      if (parts.length === 0) {
        // no where to go but to retain '..'
        // it could end up like '../package.json'
        parts.push('..');
      } else {
        parts.pop();
      }
    } else if (p !== '.') {
      parts.push(p);
    }
  });

  const resolved = parsed.prefix + parts.join('/');
  return parse(resolved).cleanId;
}

export function relativeModuleId(baseId, absoluteId) {
  const parsedBaseId = parse(baseId);
  const parsed = parse(absoluteId);

  if (parsed.bareId[0] === '.' && parsedBaseId.bareId[0] !== '.') return parsed.cleanId;

  const baseParts = parsedBaseId.parts;
  baseParts.pop();

  const parts = parsed.parts;

  while (parts.length && baseParts.length && baseParts[0] === parts[0]) {
    baseParts.shift();
    parts.shift();
  }

  let left = baseParts.length;
  if (left === 0) {
    parts.unshift('.');
  } else {
    for (let i = 0; i < left; i ++) {
      parts.unshift('..');
    }
  }

  return parsed.prefix + parts.join('/');
}

export function nodejsIds(id) {
  const parsed = parse(id);
  const ids = [parsed.cleanId];
  const {ext} = parsed;

  if (ext === '.js' || ext === '.ts' || ext === '.mjs' || ext === '.cjs') {
    ids.push(parsed.cleanId.slice(0, -ext.length));
  } if (ALTERNATIVE_CSS_EXTS.indexOf(ext) !== -1) {
    // be nice to users from webpack, allow import 'a.scss'; to work.
    ids.push(parsed.cleanId.slice(0, -ext.length) + '.css');
  } if (ALTERNATIVE_TEMPLATE_EXTS.indexOf(ext) !== -1) {
    // be nice to users from webpack, allow import 'a.md'; to work.
    ids.push(parsed.cleanId.slice(0, -ext.length) + '.html');
  }

  ids.push(parsed.cleanId + '.js');
  ids.push(parsed.cleanId + '.json');
  ids.push(parsed.cleanId + '.mjs');
  ids.push(parsed.cleanId + '.cjs');

  ids.push(parsed.cleanId + '/index');
  ids.push(parsed.cleanId + '/index.js');
  ids.push(parsed.cleanId + '/index.json');
  ids.push(parsed.cleanId + '/index.mjs');
  ids.push(parsed.cleanId + '/index.cjs');

  return ids;
}

export function mapId(id, paths = {}) {
  const parsed = parse(id);
  let idPath = parsed.bareId;
  const pathKeys = Object.keys(paths).sort((a, b) => b.length - a.length);
  for (let i = 0, len = pathKeys.length; i < len; i++) {
    const k = pathKeys[i];
    const parsedKey = parse(k);
    if (parsed.parts.length >= parsedKey.parts.length &&
        parsed.parts.slice(0, parsedKey.parts.length).join('/') === k) {
      idPath = paths[k] + idPath.slice(k.length);
      // for {'../src': ''}, remove final leading '/'
      if (paths[k] === '') idPath = idPath.slice(1);
      break;
    }
  }
  // "../src" should be mapped to "", reset it to "index".
  if (idPath === '') idPath = 'index';
  if (parsed.prefix) {
    return mapId(parsed.prefix.slice(0, -1), paths) + '!' + idPath;
  }
  return idPath;
}