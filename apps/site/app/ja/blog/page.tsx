import { blogPosts } from "../../content/posts";
import { getSiteContent } from "../../content/site-dictionary";
import { PostIndexPage } from "../../components/post-index";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export default function Page() {
  const content = getSiteContent("ja");
  return <><SiteHeader locale="ja" content={content} /><PostIndexPage locale="ja" content={content} type="blog" posts={blogPosts} /><SiteFooter locale="ja" content={content} /></>;
}
