/**
 * Ordered Media Fetcher Service
 * Strictly schedules and executes image and video preview fetching in sequence
 * according to article order (topmost news first, then next, then next).
 * 
 * Supports instant priority bumping when a user hovers on any specific card.
 */
import type { Article, VideoMatch } from '../types';
import { findActualNewsImage, getVerifiedVideosForArticle } from './videoMatcher';

export interface ArticleMediaResult {
  imageUrl: string | null;
  imageSource: string | null;
  isRealPhoto: boolean;
  videoMatch: VideoMatch | null;
  is90PercentAccurate: boolean;
  confidencePercent: number;
  previewUrl: string | null;
}

interface QueueTask {
  article: Article;
  index: number;
  priority: number;
  callbacks: Set<(result: ArticleMediaResult) => void>;
}

class OrderedMediaFetcher {
  private cache = new Map<number, ArticleMediaResult>();
  private queue: QueueTask[] = [];
  private isProcessing = false;
  private activeArticleId: number | null = null;

  /**
   * Subscribe an article to receive its media in order.
   * Higher priority comes first (topmost news has index 0 => priority 10000 - index).
   */
  public subscribe(
    article: Article,
    index: number,
    onResult: (result: ArticleMediaResult) => void
  ): () => void {
    // 1. If already cached, deliver immediately
    if (this.cache.has(article.id)) {
      onResult(this.cache.get(article.id)!);
      return () => {};
    }

    // 2. Check if already in queue
    let task = this.queue.find(t => t.article.id === article.id);
    if (task) {
      task.callbacks.add(onResult);
    } else {
      // Priority: index 0 gets 10000, index 1 gets 9999, etc.
      const initialPriority = Math.max(0, 10000 - index);
      task = {
        article,
        index,
        priority: initialPriority,
        callbacks: new Set([onResult])
      };
      this.queue.push(task);
      this.sortQueue();
    }

    this.processNext();

    // Unsubscribe cleanup
    return () => {
      if (task) {
        task.callbacks.delete(onResult);
        if (task.callbacks.size === 0 && this.activeArticleId !== article.id) {
          this.queue = this.queue.filter(t => t.article.id !== article.id);
        }
      }
    };
  }

  /**
   * Instantly elevate an article to the front of the queue when hovered
   */
  public prioritize(articleId: number): void {
    const task = this.queue.find(t => t.article.id === articleId);
    if (task) {
      task.priority = 999999; // Top priority
      this.sortQueue();
      this.processNext();
    }
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Sequential execution loop: processes at most one article at a time in order
   */
  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const currentTask = this.queue.shift();
    if (!currentTask) {
      this.isProcessing = false;
      return;
    }

    const { article, callbacks } = currentTask;
    this.activeArticleId = article.id;

    try {
      // Check cache first
      if (this.cache.has(article.id)) {
        const cached = this.cache.get(article.id)!;
        callbacks.forEach(cb => cb(cached));
      } else {
        // Step 1: Discover and verify high-accuracy video
        let videoMatch: VideoMatch | null = null;
        try {
          videoMatch = await getVerifiedVideosForArticle(article);
        } catch {}

        // Step 2: Discover and verify actual news image
        let imageUrl = article.image?.url || null;
        let imageSource = article.image?.sourceTitle || null;
        let isRealPhoto = Boolean(article.image?.isRealNewsPhoto);

        // If high-accuracy video exists with broadcast photo, use it
        if (videoMatch?.primary?.thumbnailUrl) {
          imageUrl = videoMatch.primary.thumbnailUrl;
          imageSource = videoMatch.primary.channel || 'Official Broadcast Photo';
          isRealPhoto = true;
        } else {
          try {
            const actualImg = await findActualNewsImage(article);
            if (actualImg?.imageUrl) {
              imageUrl = actualImg.imageUrl;
              imageSource = actualImg.sourceTitle || 'Verified Press Photo';
              isRealPhoto = true;
            }
          } catch {}
        }

        const accuracyScore = videoMatch?.bestAccuracy ?? (videoMatch?.primary?.accuracy ?? 0);
        const confidencePercent = videoMatch?.primary?.confidencePercent ?? Math.round(accuracyScore * 100);
        const is90PercentAccurate = Boolean(
          videoMatch?.hasHighlyAccuratePreview ||
          videoMatch?.primary?.isHighlyAccurate ||
          confidencePercent >= 90 ||
          accuracyScore >= 0.88
        );

        const previewUrl = videoMatch?.primary?.previewUrl || null;

        const result: ArticleMediaResult = {
          imageUrl,
          imageSource,
          isRealPhoto,
          videoMatch,
          is90PercentAccurate,
          confidencePercent,
          previewUrl
        };

        this.cache.set(article.id, result);
        callbacks.forEach(cb => cb(result));
      }
    } catch {
      // Fail gracefully
    } finally {
      this.activeArticleId = null;
      this.isProcessing = false;

      // Small 80ms breathing space to ensure orderly execution without choking the browser
      setTimeout(() => {
        this.processNext();
      }, 80);
    }
  }

  public getCached(articleId: number): ArticleMediaResult | undefined {
    return this.cache.get(articleId);
  }
}

export const orderedMediaFetcher = new OrderedMediaFetcher();
