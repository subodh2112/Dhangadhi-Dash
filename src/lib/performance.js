export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit = 1000) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function getOptimizedImageUrl(url, width = 400, quality = 80) {
  if (!url) return "";
  if (url.includes("unsplash.com")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}w=${width}&q=${quality}`;
  }
  return url;
}

const cache = new Map();

export function withCache(key, fetcher, ttl = 60000) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < ttl) {
    return Promise.resolve(cached.data);
  }
  return fetcher().then((data) => {
    cache.set(key, { data, time: Date.now() });
    return data;
  });
}

export function clearCache(pattern) {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

export function measurePerformance(label, fn) {
  const start = performance.now();
  const result = fn();
  if (result instanceof Promise) {
    return result.then((data) => {
      const duration = performance.now() - start;
      if (duration > 500) console.warn(`[Performance] ${label} took ${duration.toFixed(0)}ms`);
      return data;
    });
  }
  const duration = performance.now() - start;
  if (duration > 500) console.warn(`[Performance] ${label} took ${duration.toFixed(0)}ms`);
  return result;
}