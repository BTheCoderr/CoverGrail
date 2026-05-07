export type ScanImageRow = {
  image_type: string;
  sort_order?: number | null;
};

export function sortScanImages<T extends ScanImageRow>(images: T[]): T[] {
  const rank: Record<string, number> = {
    front_cover: 0,
    back_cover: 1,
    spine: 2,
    corner: 3,
  };
  return [...images].sort((a, b) => {
    const ra = rank[a.image_type] ?? 99;
    const rb = rank[b.image_type] ?? 99;
    if (ra !== rb) return ra - rb;
    const pa = Number(a.sort_order ?? 0);
    const pb = Number(b.sort_order ?? 0);
    return pa - pb;
  });
}
