import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import Head from 'next/head';
import Link from 'next/link';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Prismic from '@prismicio/client'
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ results }: PostPagination) {
  console.log("posts",results);
  return (
    <>
      <Head>
        <title>Posts | Ignews</title>
      </Head>

      <main className={styles.container} >
        <div className={styles.posts}>
          {results.map(post => (
            <Link href={`posts/${post.uid}`}>
              <a key={post.uid}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle} </p>
                <div>
                <time>{post.first_publication_date}</time>
                <p>{post.data.author}</p>
                </div>
              </a>
            </Link>
          ))}
        </div>
        <Link href={`/sds`}><a>Carregar mais...</a></Link>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 20,
  });

  const results = postsResponse.results.map(posts => {
    return {
      uid: posts.uid,
      first_publication_date: format(
        new Date(posts.first_publication_date),
        'dd MMM yyyy',
       
        {
          locale: ptBR,
        }
      ),
      data: {
        title: posts.data.title,
        subtitle: posts.data.subtitle,
        author: posts.data.author,
      },
    }
  });

    console.log("results",postsResponse.results);
  return {
    props: {
      results,
    },
  }
};
