const KNOWN_EXTS = ['.js', '.json', '.html', '.htm', '.svg', '.css', '.wasm'];
const idMatcher = /^(\w+!)?(.+?)\/?$/;

export function cleanPath(path = '') {
  let clean = path.trim();
  if (clean.length && clean[clean.length - 1] === '/') {
    clean = clean.substring(0, clean.length - 1);
  }
  return clean;
}

export function ext(id = '') {
  let clean = cleanPath(id);

  const parts = clean.split('/');
  const last = parts.pop();
  const dotPos = last.lastIndexOf('.');
  if (dotPos !== -1) {
    const ext = last.substring(dotPos).toLowerCase();
    if (KNOWN_EXTS.indexOf(ext) !== -1) return ext;
  }
  return '';
}

export function parse(id = '') {
  let m = id.trim().match(idMatcher);
  if (!m) throw new Error(`not a vaid module id: "${id}"`);
  const prefix = m[1] || '';
  let bareId = m[2];

  let extname = ext(bareId);
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

  if (parsed.ext === '.js') {
    const trimed = parsed.cleanId.substring(0, parsed.cleanId.length - 3);
    ids.push(trimed);
  } else if (!parsed.ext) {
    ids.push(parsed.cleanId + '.js');
    ids.push(parsed.cleanId + '.json');
  }

  ids.push(parsed.cleanId + '/index');
  ids.push(parsed.cleanId + '/index.js');
  ids.push(parsed.cleanId + '/index.json');

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
      idPath = paths[k] + idPath.substring(k.length);
      break;
    }
  }
  return parsed.prefix + idPath;
}