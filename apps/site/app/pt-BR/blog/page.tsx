import { blogPosts } from "../../content/posts";
import { getSiteContent } from "../../content/site-dictionary";
import { PostIndexPage } from "../../components/post-index";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export default function Page() {
  const content = getSiteContent("pt-BR");
  return <><SiteHeader locale="pt-BR" content={content} /><PostIndexPage locale="pt-BR" content={content} type="blog" posts={blogPosts} /><SiteFooter locale="pt-BR" content={content} /></>;
}
