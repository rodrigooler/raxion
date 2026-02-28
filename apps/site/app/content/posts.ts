import type { Locale } from "../../lib/site";
import postsData from "./posts.data.json";

type Localized<T> = Record<Locale, T>;

export type RichSection = {
  heading: Localized<string>;
  paragraphs: Localized<string[]>;
  bullets?: Localized<string[]>;
};

export type Post = {
  type: "announcement" | "blog";
  slug: string;
  date: string;
  author: {
    name: string;
    githubUrl: string;
    avatarUrl: string;
  };
  title: Localized<string>;
  summary: Localized<string>;
  body: RichSection[];
};

type PostsPayload = {
  announcementPosts: Post[];
  blogPosts: Post[];
};

const payload = postsData as PostsPayload;

export const announcementPosts: Post[] = payload.announcementPosts;
export const blogPosts: Post[] = payload.blogPosts;
export const latestAnnouncement = announcementPosts[0];
export const allPosts: Post[] = [...announcementPosts, ...blogPosts].sort((left, right) =>
  right.date.localeCompare(left.date)
);

export function findAnnouncement(slug: string): Post | undefined {
  return announcementPosts.find((post) => post.slug === slug);
}

export function findBlogPost(slug: string): Post | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
