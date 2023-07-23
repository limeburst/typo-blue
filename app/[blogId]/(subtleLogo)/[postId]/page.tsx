import LinkButton from "@/components/LinkButton";
import PublishPostButton from "@/components/PublishPostButton";
import { prisma } from "@/lib/db";
import { encodePostId, getCurrentUser } from "@/lib/server-util";
import { Prisma } from "@prisma/client";
import { decode } from "@urlpack/base62";
import { formatInTimeZone } from "date-fns-tz";
import format from "date-fns/format";
import Link from "next/link";
import { env } from "process";

export default async function BlogPost({ params }: { params: { blogId: string, postId: string } }) {
    const currentUser = await getCurrentUser();

    const blogId = decodeURIComponent(params.blogId)
    if (!blogId.startsWith('@')) return <p>👀</p>

    const slug = blogId.replace('@', '');
    const blog = await prisma.blog.findUnique({
        where: {
            slug: slug,
        },
        include: {
            user: true,
        },
    });

    if (!blog) {
        return <p>블로그가 존재하지 않습니다.</p>
    }

    const isCurrentUserBlogOwner = blog.user.email === currentUser?.email;

    let post;
    try {
        post = await prisma.post.findUnique({
            where: {
                uuid: Buffer.from(decode(params.postId)).toString('hex')
            }
        });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2023') {
            return <p>글이 존재하지 않습니다.</p>
        }

        throw e;
    }

    if (!post || (!post.publishedAt && !isCurrentUserBlogOwner)) {
        return <p>글이 존재하지 않습니다.</p>
    }

    return <div className="space-y-8">
        <div className="flex flex-row space-x-2 items-baseline">
            <h3 className="text-2xl">
                <Link href={`/@${blog.slug}/${encodePostId(post.uuid)}`}>
                    {post.title === '' ? '무제' : post.title}
                </Link>
            </h3>
            <span className="text-neutral-500">{formatInTimeZone(post.publishedAt ?? post.updatedAt, process.env.TZ!,'yyyy-MM-dd HH:mm')}</span>
        </div>
        <div className="prose dark:prose-invert break-keep" dangerouslySetInnerHTML={{ __html: post.content }} />
        {isCurrentUserBlogOwner &&
            <div className="flex flex-row space-x-2">
                <LinkButton href={`/${blogId}/${params.postId}/edit`} className="flex">수정</LinkButton>
                <PublishPostButton slug={blog.slug} postId={encodePostId(post.uuid)} publishedAt={post.publishedAt} />
            </div>
        }
    </div>
}
