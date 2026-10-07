import {
  PRODUCT_ANALYTICS_MAX_PROPERTIES_BYTES,
  PRODUCT_ANALYTICS_MAX_SCREEN_NAME,
  advanceProductAnalyticsSession,
  claimProductAnalyticsFirstOpen,
  type ProductAnalyticsStorage,
  type SdkProductAnalyticsEvent,
} from './productAnalytics';
import type { SdkContext } from './identity';

export type ProductAnalyticsIdentity = {
  appUserId: string;
  customUserId?: string;
};

export type ProductAnalyticsPropertyMap = NonNullable<SdkProductAnalyticsEvent['properties']>;

/** First events wait this long for an attribution snapshot, then emit anyway. */
export const PRODUCT_ANALYTICS_ATTRIBUTION_WAIT_MS = 3_000;

export type ProductAnalyticsClientOptions = {
  storage: ProductAnalyticsStorage;
  enqueue: (event: SdkProductAnalyticsEvent) => void;
  now?: () => number;
  createId: () => string;
  firstEventName: 'first_visit' | 'first_open';
  getIdentity: () => ProductAnalyticsIdentity;
  getContext: () => SdkContext | undefined;
  enabled?: boolean;
  /**
   * Resolves when the first attribution snapshot is known.
   * Emission waits for it, or for `attributionWaitMs`, whichever is first.
   */
  whenAttributionReady?: () => Promise<void>;
  attributionWaitMs?: number;
  /**
   * Called when a new session starts, before that session's attribution is frozen.
   * Later events in the session reuse the snapshot from this moment.
   */
  onSessionStart?: (sessionId: string) => void | Promise<void>;
};

const validName = (name: string): string | null => {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 120) return null;
  return trimmed;
};

const validProperties = (
  properties: ProductAnalyticsPropertyMap | undefined,
): ProductAnalyticsPropertyMap | undefined => {
  if (!properties) return undefined;
  if (JSON.stringify(properties).length > PRODUCT_ANALYTICS_MAX_PROPERTIES_BYTES) return undefined;
  return properties;
};

const clipScreen = (name: string): string => name.trim().slice(0, PRODUCT_ANALYTICS_MAX_SCREEN_NAME);

/**
 * Session, first-open, and event emission shared by the web and React Native SDKs.
 * Storage and HTTP stay outside this class.
 */
export class ProductAnalyticsClient {
  private sessionId: string | null = null;
  private customUserId: string | undefined;
  private lastScreen: string | null = null;
  private tail: Promise<void> = Promise.resolve();
  private attributionSettled: Promise<void> | null = null;
  private frozenAttribution: SdkContext['attribution'];
  private attributionFrozen = false;
  private readonly enabled: boolean;

  constructor(private readonly options: ProductAnalyticsClientOptions) {
    this.enabled = options.enabled !== false;
  }

  start = (): Promise<void> => this.run(async () => {
    if (!this.enabled) return;
    await this.touchSession();
    if (await claimProductAnalyticsFirstOpen(this.options.storage)) {
      this.emit(this.options.firstEventName);
    }
  });

  logEvent = (name: string, properties?: ProductAnalyticsPropertyMap): void => {
    if (!this.enabled) return;
    const trimmed = validName(name);
    if (!trimmed) return;
    void this.run(async () => {
      await this.touchSession();
      this.emit(trimmed, undefined, validProperties(properties));
    });
  };

  /** Records `screen_view` or `page_view`. Repeating the same name in a row is ignored. */
  view = (kind: 'screen_view' | 'page_view', name: string, properties?: ProductAnalyticsPropertyMap): void => {
    if (!this.enabled) return;
    const screenName = clipScreen(name);
    if (!screenName) return;
    if (this.lastScreen === `${kind}:${screenName}`) return;
    void this.run(async () => {
      if (this.lastScreen === `${kind}:${screenName}`) return;
      this.lastScreen = `${kind}:${screenName}`;
      await this.touchSession();
      this.emit(kind, screenName, validProperties(properties));
    });
  };

  setUserId = (id: string | null | undefined): void => {
    const trimmed = id?.trim();
    this.customUserId = trimmed ? trimmed : undefined;
  };

  private run = (fn: () => Promise<void>): Promise<void> => {
    const next = this.tail.then(
      () => this.waitForAttribution().then(fn),
      () => this.waitForAttribution().then(fn),
    );
    this.tail = next.then(() => undefined, () => undefined);
    return next;
  };

  /** One-shot. Later events in the same client do not wait again. */
  private waitForAttribution = (): Promise<void> => {
    if (this.attributionSettled) return this.attributionSettled;
    const ready = this.options.whenAttributionReady;
    if (!ready) {
      this.attributionSettled = Promise.resolve();
      return this.attributionSettled;
    }
    const waitMs = this.options.attributionWaitMs ?? PRODUCT_ANALYTICS_ATTRIBUTION_WAIT_MS;
    this.attributionSettled = new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(finish, waitMs);
      void Promise.resolve()
        .then(ready)
        .then(finish, finish);
    });
    return this.attributionSettled;
  };

  private touchSession = async (): Promise<void> => {
    const advance = await advanceProductAnalyticsSession(
      this.options.storage,
      (this.options.now ?? Date.now)(),
      this.options.createId,
    );
    this.sessionId = advance.sessionId;
    if (advance.started) {
      await this.options.onSessionStart?.(advance.sessionId);
      this.freezeAttribution();
      this.emit('session_start');
      return;
    }
    if (!this.attributionFrozen) this.freezeAttribution();
  };

  /** The landing hit owns the session. A later change does not rewrite it. */
  private freezeAttribution = (): void => {
    this.frozenAttribution = this.options.getContext()?.attribution;
    this.attributionFrozen = true;
  };

  private contextForEvent = (): SdkContext | undefined => {
    const live = this.options.getContext();
    if (!live) return undefined;
    if (!this.attributionFrozen) return live;
    const { attribution: _liveAttribution, ...rest } = live;
    const attribution = this.frozenAttribution;
    if (!attribution || Object.keys(attribution).length === 0) return rest;
    return { ...rest, attribution };
  };

  private emit = (
    name: string,
    screenName?: string,
    properties?: ProductAnalyticsPropertyMap,
  ): void => {
    const sessionId = this.sessionId;
    if (!sessionId) return;
    const identity = this.options.getIdentity();
    const customUserId = this.customUserId ?? identity.customUserId;
    const context = this.contextForEvent();
    const event: SdkProductAnalyticsEvent = {
      eventId: this.options.createId(),
      name,
      timestamp: new Date((this.options.now ?? Date.now)()).toISOString(),
      identity: {
        appUserId: identity.appUserId,
        sessionId,
        ...(customUserId ? { customUserId } : {}),
      },
      ...(context ? { context } : {}),
      ...(screenName ? { screenName } : {}),
      ...(properties ? { properties } : {}),
    };
    this.options.enqueue(event);
  };
}
