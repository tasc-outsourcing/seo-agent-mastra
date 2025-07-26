// Dynamic model loader to avoid build-time MongoDB access
export async function getArticleModel() {
  const { Article } = await import('@/models/Article')
  return Article
}