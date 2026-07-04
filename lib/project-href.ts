export function projectHref(
  href: string,
  projectId: string | null | undefined
): string {
  if (!projectId) return href;

  const [beforeHash, hash] = href.split("#", 2);
  const [path, search] = beforeHash.split("?", 2);
  const params = new URLSearchParams(search ?? "");
  params.set("projectId", projectId);

  const query = params.toString();
  const nextHref = query ? `${path}?${query}` : path;
  return hash ? `${nextHref}#${hash}` : nextHref;
}
