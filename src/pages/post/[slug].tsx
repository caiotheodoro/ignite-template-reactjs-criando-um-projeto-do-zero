import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import PrismicDOM from 'prismic-dom';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  nextPost: NeighborhoodPost;
  previousPost: NeighborhoodPost;
}

interface NeighborhoodPost {
  title: string;
  uid: string;
}

export default function Post({ post, preview, previousPost, nextPost }: PostProps) {
  const router = useRouter()

  const totalContent = post.data.content.reduce((acc, el) => {
    const textBody = PrismicDOM.RichText.asText(el.body);
    const words = textBody.split(' ');
    acc.words += words.length;
    return acc;
  }, {
    words: 0
  })

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>

      {post.data.banner.url && <img className={styles.banner} src={post.data.banner.url} alt='banner' />}

      <main className={commonStyles.container}>
        <article className={`${commonStyles.contentContainer} ${styles.post}`}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.info}>
            <FiCalendar /> <time>{post.first_publication_date}</time>
            <FiUser /> <p> {post.data.author} </p>
            <FiClock /> <p>{Math.ceil(totalContent.words / 200)} min</p>

          </div>

          {post.data.content.map(content => (
            <div key={Math.random()} className={styles.content}>
              <h2>{content.heading}</h2>
              {content.body.map(body => (
                <div
                  key={Math.random()}
                  dangerouslySetInnerHTML={{ __html: body.text }}
                />
              ))}
            </div>
          ))}

          <div className={styles.divider} />
        


        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ]);

  let paths = [];

  paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return { paths, fallback: true }
};

function verifyNeighborhoodPost(post, slug): NeighborhoodPost | null {
  return slug === post.results[0].uid
    ? null
    : {
      title: post.results[0]?.data?.title,
      uid: post.results[0]?.uid,
    };
}

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});
  const result = {
    ...response, first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',

      {
        locale: ptBR,
      }
    ),
  };


  const responsePreviousPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: slug,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const responseNextPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 1, after: slug, orderings: '[document.first_publication_date]' }
  );

  const nextPost = verifyNeighborhoodPost(responseNextPost, slug);

  const previousPost = verifyNeighborhoodPost(responsePreviousPost, slug);

  const post = result;

  return {
    props: {
      post,
      preview,
      nextPost,
      previousPost
    }
  }
};