import LinkButton from "@/components/LinkButton";
import PostList from "@/components/PostList";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/server-util";

export default async function BlogHome({ params }: { params: { blogId: string } }) {
    const currentUser = await getCurrentUser();

    const blogId = decodeURIComponent(params.blogId)
    if (!blogId.startsWith('@')) return <p>👀</p>

    const slug = blogId.replace('@', '');
    const blog = await prisma.blog.findUnique({
        where: {
            slug: slug
        },
        include: {
            posts: {
                orderBy: {
                    createdAt: 'desc'
                },
            },
            user: true,
        }
    });

    if (!blog) {
        return <p>블로그가 존재하지 않습니다.</p>
    }

    const isCurrentUserBlogOwner = blog.user.email === currentUser?.email;
    const draftPosts = blog.posts.filter((post) => post.publishedAt === null);
    const publishedPosts = blog.posts.filter((post) => post.publishedAt !== null);
    
    return <div className="space-y-8">
        {isCurrentUserBlogOwner && <PostList name="임시 저장된 글 목록" blog={blog} posts={draftPosts} showTitle={isCurrentUserBlogOwner} />}
        <PostList name="발행된 글 목록" blog={blog} posts={publishedPosts} showTitle={isCurrentUserBlogOwner} />

        {isCurrentUserBlogOwner &&
            <div className="space-x-2">
                <LinkButton href={`/@${blog.slug}/new-post`}>새 글 쓰기</LinkButton>
                <LinkButton href={`/@${blog.slug}/edit`}>블로그 관리</LinkButton>
            </div>
        }
    </div>
}
