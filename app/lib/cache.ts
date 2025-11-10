// app/lib/cache.ts
export interface CacheOptions {
  ttl?: number; // Time to live em segundos
  maxSize?: number; // Tamanho máximo do cache
  strategy?: "lru" | "fifo" | "lfu"; // Estratégia de remoção
  namespace?: string; // Namespace para organização
  compress?: boolean; // Compressão de dados grandes
  persistent?: boolean; // Persistir no localStorage/Redis
}

export interface CacheItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  size: number;
  hits: number; // Para estratégia LFU
  lastAccess: number; // Para estratégia LRU
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalItems: number;
  totalSize: number;
  maxSize: number;
  evictions: number;
  strategy: string;
}

class CacheManager<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private options: Required<CacheOptions>;
  private stats: CacheStats;
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 3600, // 1 hora padrão
      maxSize: options.maxSize || 1000, // 1000 itens padrão
      strategy: options.strategy || "lru",
      namespace: options.namespace || "default",
      compress: options.compress || false,
      persistent: options.persistent || false,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalItems: 0,
      totalSize: 0,
      maxSize: this.options.maxSize,
      evictions: 0,
      strategy: this.options.strategy,
    };

    // Carregar cache persistente se habilitado
    if (this.options.persistent && typeof window !== "undefined") {
      this.loadFromPersistent();
    }

    // Limpeza automática a cada 5 minutos
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Armazena um item no cache
   */
  set(key: string, value: T, customTtl?: number): void {
    const fullKey = this.getFullKey(key);
    const ttl = customTtl || this.options.ttl;
    const now = Date.now();
    const size = this.calculateSize(value);

    // Verificar se precisa fazer eviction
    if (this.cache.size >= this.options.maxSize && !this.cache.has(fullKey)) {
      this.evict();
    }

    // Limpar timer existente se houver
    if (this.timers.has(fullKey)) {
      clearTimeout(this.timers.get(fullKey)!);
      this.timers.delete(fullKey);
    }

    // Criar item de cache
    const item: CacheItem<T> = {
      key: fullKey,
      value: this.options.compress ? this.compress(value) : value,
      timestamp: now,
      ttl: ttl * 1000, // Converter para ms
      size,
      hits: 0,
      lastAccess: now,
    };

    this.cache.set(fullKey, item);
    this.updateStats();

    // Configurar expiração automática
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl * 1000);
      this.timers.set(fullKey, timer);
    }

    // Persistir se habilitado
    if (this.options.persistent) {
      this.saveToPersistent();
    }
  }

  /**
   * Recupera um item do cache
   */
  get(key: string): T | null {
    const fullKey = this.getFullKey(key);
    const item = this.cache.get(fullKey);

    if (!item) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Verificar se expirou
    if (this.isExpired(item)) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Atualizar estatísticas de acesso
    item.hits++;
    item.lastAccess = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    // Retornar valor (descomprimido se necessário)
    return this.options.compress ? this.decompress(item.value) : item.value;
  }

  /**
   * Verifica se uma chave existe no cache
   */
  has(key: string): boolean {
    const fullKey = this.getFullKey(key);
    const item = this.cache.get(fullKey);

    if (!item) return false;

    if (this.isExpired(item)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove um item do cache
   */
  delete(key: string): boolean {
    const fullKey = this.getFullKey(key);
    const existed = this.cache.delete(fullKey);

    if (existed) {
      // Limpar timer
      if (this.timers.has(fullKey)) {
        clearTimeout(this.timers.get(fullKey)!);
        this.timers.delete(fullKey);
      }

      this.updateStats();

      if (this.options.persistent) {
        this.saveToPersistent();
      }
    }

    return existed;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    // Limpar todos os timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.cache.clear();
    this.timers.clear();
    this.updateStats();

    if (this.options.persistent) {
      this.clearPersistent();
    }
  }

  /**
   * Obtém ou define um valor (pattern cache-aside)
   */
  async getOrSet<R>(
    key: string,
    factory: () => Promise<R> | R,
    customTtl?: number
  ): Promise<R> {
    const cached = this.get(key);

    if (cached !== null) {
      return cached as R;
    }

    const value = await factory();
    this.set(key, value as T, customTtl);

    return value;
  }

  /**
   * Obtém múltiplas chaves
   */
  multiGet(keys: string[]): Map<string, T | null> {
    const result = new Map<string, T | null>();

    for (const key of keys) {
      result.set(key, this.get(key));
    }

    return result;
  }

  /**
   * Define múltiplas chaves
   */
  multiSet(items: Map<string, T>, customTtl?: number): void {
    for (const [key, value] of items) {
      this.set(key, value, customTtl);
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Lista todas as chaves no cache
   */
  keys(): string[] {
    const keys: string[] = [];
    const prefix = `${this.options.namespace}:`;

    for (const fullKey of this.cache.keys()) {
      if (fullKey.startsWith(prefix)) {
        keys.push(fullKey.substring(prefix.length));
      }
    }

    return keys;
  }

  /**
   * Obtém informações de um item específico
   */
  inspect(key: string): Omit<CacheItem<T>, "value"> | null {
    const fullKey = this.getFullKey(key);
    const item = this.cache.get(fullKey);

    if (!item) return null;

    const { value, ...info } = item;
    return info;
  }

  private getFullKey(key: string): string {
    return `${this.options.namespace}:${key}`;
  }

  private isExpired(item: CacheItem<T>): boolean {
    if (item.ttl <= 0) return false; // TTL 0 = não expira
    return Date.now() - item.timestamp > item.ttl;
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string;

    switch (this.options.strategy) {
      case "lru":
        keyToEvict = this.findLRU();
        break;
      case "lfu":
        keyToEvict = this.findLFU();
        break;
      case "fifo":
      default:
        keyToEvict = this.findFIFO();
        break;
    }

    this.cache.delete(keyToEvict);

    if (this.timers.has(keyToEvict)) {
      clearTimeout(this.timers.get(keyToEvict)!);
      this.timers.delete(keyToEvict);
    }

    this.stats.evictions++;
  }

  private findLRU(): string {
    let oldestKey = "";
    let oldestTime = Date.now();

    for (const [key, item] of this.cache) {
      if (item.lastAccess < oldestTime) {
        oldestTime = item.lastAccess;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private findLFU(): string {
    let leastUsedKey = "";
    let leastHits = Infinity;

    for (const [key, item] of this.cache) {
      if (item.hits < leastHits) {
        leastHits = item.hits;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  private findFIFO(): string {
    let oldestKey = "";
    let oldestTime = Date.now();

    for (const [key, item] of this.cache) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private calculateSize(value: T): number {
    // Estimativa simples do tamanho
    const json = JSON.stringify(value);
    return new Blob([json]).size;
  }

  private compress(value: T): T {
    // Implementação simplificada - em produção usar biblioteca de compressão
    return value;
  }

  private decompress(value: T): T {
    // Implementação simplificada
    return value;
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache) {
      if (this.isExpired(item)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!);
        this.timers.delete(key);
      }
    }

    if (keysToDelete.length > 0) {
      this.updateStats();
      if (this.options.persistent) {
        this.saveToPersistent();
      }
    }
  }

  private updateStats(): void {
    this.stats.totalItems = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values()).reduce(
      (sum, item) => sum + item.size,
      0
    );
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private loadFromPersistent(): void {
    try {
      const stored = localStorage.getItem(`cache_${this.options.namespace}`);
      if (stored) {
        const data = JSON.parse(stored);
        for (const [key, item] of Object.entries(data)) {
          this.cache.set(key, item as CacheItem<T>);
        }
        this.updateStats();
      }
    } catch (error) {
      console.warn("Erro ao carregar cache persistente:", error);
    }
  }

  private saveToPersistent(): void {
    if (typeof window === "undefined") return;

    try {
      const data = Object.fromEntries(this.cache);
      localStorage.setItem(
        `cache_${this.options.namespace}`,
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn("Erro ao salvar cache persistente:", error);
    }
  }

  private clearPersistent(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(`cache_${this.options.namespace}`);
    } catch (error) {
      console.warn("Erro ao limpar cache persistente:", error);
    }
  }
}

// Instâncias pré-configuradas
export const apiCache = new CacheManager({
  ttl: 300, // 5 minutos
  maxSize: 500,
  strategy: "lru",
  namespace: "api",
  compress: false,
});

export const checkoutCache = new CacheManager({
  ttl: 1800, // 30 minutos
  maxSize: 1000,
  strategy: "lru",
  namespace: "checkout",
  compress: true,
});

export const metricsCache = new CacheManager({
  ttl: 60, // 1 minuto
  maxSize: 200,
  strategy: "fifo",
  namespace: "metrics",
});

// Decorator para cache automático
export function cached<T extends any[], R>(
  cache: CacheManager,
  keyGenerator: (...args: T) => string,
  ttl?: number
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const key = keyGenerator(...args);

      const cached = cache.get(key);
      if (cached !== null) {
        return cached;
      }

      const result = await method.apply(this, args);
      cache.set(key, result, ttl);

      return result;
    };
  };
}

// Middleware para cache de resposta HTTP
export function withCache(
  cache: CacheManager,
  keyGenerator: (request: Request) => string,
  ttl?: number
) {
  return function <T extends any[], R>(handler: (...args: T) => Promise<R>) {
    return async (...args: T): Promise<R> => {
      // Para Next.js, o primeiro argumento é geralmente o request
      const request = args[0] as any;

      if (request && typeof request.url === "string") {
        const key = keyGenerator(request);

        const cached = cache.get(key);
        if (cached !== null) {
          return cached;
        }

        const result = await handler(...args);
        cache.set(key, result, ttl);

        return result;
      }

      // Se não conseguir extrair a key, executar sem cache
      return handler(...args);
    };
  };
}

export { CacheManager };
export default CacheManager;
