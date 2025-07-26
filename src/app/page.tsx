import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to the SEO article creator as the main entry point
  redirect('/seo-article-creator')
}
