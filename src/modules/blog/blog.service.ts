// src/modules/blog/blog.service.ts
import slugify from "slugify";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";

const POST_INCLUDE = { author: { select: { id: true, name: true, avatar: true } } };

export async function getPosts(skip: number, take: number, tag?: string, published: boolean = true, search?: string) {
  const where: any = { published };

  if (tag) where.tags = { has: tag };

  if (search) {
    where.AND = [
      {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { excerpt: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.blogPost.findMany({
      where,
      include: POST_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { data, total };
}

export async function getPost(slugOrId: string) {
  const p = await prisma.blogPost.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        { id: slugOrId }
      ]
    },
    include: POST_INCLUDE
  });

  if (!p) throw AppError.notFound("Post not found");

  prisma.blogPost.update({
    where: { id: p.id }, 
    data: { viewCount: { increment: 1 } }
  }).catch(err => console.error("View count update failed:", err));

  return p;
}

export async function searchPosts(q: string, skip: number, take: number) {
  const where: any = {
    published: true,
    OR: [{ title: { contains: q, mode: "insensitive" } }, { excerpt: { contains: q, mode: "insensitive" } }],
  };
  const [data, total] = await prisma.$transaction([
    prisma.blogPost.findMany({ where, include: POST_INCLUDE, skip, take }),
    prisma.blogPost.count({ where }),
  ]);
  return { data, total };
}

export async function createPost(data: any, authorId: string) {
  const base = slugify(data.title, { lower: true, strict: true });
  let slug = base;
  let n = 1;
  while (await prisma.blogPost.findUnique({ where: { slug } })) { slug = `${base}-${n++}`; }
  const readTime = Math.ceil(data.content.split(" ").length / 200);
  return prisma.blogPost.create({ data: { ...data, slug, authorId, readTime }, include: POST_INCLUDE });
}

export async function updatePost(id: string, data: any, userId: string, role: string) {
  const p = await prisma.blogPost.findUnique({ where: { id } });
  if (!p) throw AppError.notFound("Post not found");
  if (p.authorId !== userId && role !== "ADMIN") throw AppError.forbidden("Not authorized");
  return prisma.blogPost.update({ where: { id }, data, include: POST_INCLUDE });
}

export async function setPublished(id: string, published: boolean) {
  return prisma.blogPost.update({
    where: { id },
    data: { published, ...(published && { publishedAt: new Date() }) },
  });
}

export async function deletePost(id: string, userId: string, role: string) {
  const p = await prisma.blogPost.findUnique({ where: { id } });
  if (!p) throw AppError.notFound("Post not found");
  if (p.authorId !== userId && role !== "ADMIN") throw AppError.forbidden("Not authorized");
  await prisma.blogPost.delete({ where: { id } });
}
