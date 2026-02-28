import { announcementPosts } from "../content/posts";
import { getSiteContent } from "../content/site-dictionary";
import { PostIndexPage } from "../components/post-index";
import { SiteFooter, SiteHeader } from "../components/site-shell";

export default function Page() {
  const content = getSiteContent("en");
  return <><SiteHeader locale="en" content={content} /><PostIndexPage locale="en" content={content} type="announcement" posts={announcementPosts} /><SiteFooter locale="en" content={content} /></>;
}
