// Одноразовый перенос: строковая категория товара -> categoryId по совпадению пути узла дерева 1С
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const categories = await prisma.productCategory.findMany({ select: { id: true, name: true, parentId: true } });
  const byId = new Map(categories.map(c => [c.id, c]));
  const pathOf = (c: { id: string; name: string; parentId: string | null }): string => {
    const segs = [c.name];
    let cur = c.parentId ? byId.get(c.parentId) : undefined;
    const guard = new Set<string>();
    while (cur && !guard.has(cur.id)) { guard.add(cur.id); segs.unshift(cur.name); cur = cur.parentId ? byId.get(cur.parentId) : undefined; }
    return segs.join(' / ');
  };
  const byPath = new Map(categories.map(c => [pathOf(c).toLowerCase(), c.id]));
  const products = await prisma.product.findMany({ where: { categoryId: null, category: { not: null } }, select: { id: true, category: true } });
  let updated = 0;
  for (const p of products) {
    const id = byPath.get((p.category || '').trim().toLowerCase());
    if (id) { await prisma.product.update({ where: { id: p.id }, data: { categoryId: id } }); updated++; }
  }
  console.log(`Перенесено: ${updated} из ${products.length}`);
}

main().finally(() => prisma.$disconnect());
