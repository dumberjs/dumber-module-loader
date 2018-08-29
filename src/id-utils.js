
export function cleanPath(path = '') {
  path = path.trim();
  const len = path.length;
  if (len && path[len - 1] === '/') path = path.substr(0, len - 1);
  return path;
}

export function stripPluginPrefixOrSubfix(moduleId = '') {
  moduleId = moduleId.trim();
  const hasPrefix = moduleId.match(/^\w+\!(.+)$/);
  if (hasPrefix) {
    return hasPrefix[1];
  }

  const hasSubfix = moduleId.match(/^(.+)\!\w+$/);
  if (hasSubfix) {
    return hasSubfix[1];
  }

  return moduleId;
}