import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import Head from 'next/head';
import Link from 'next/link';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Prismic from '@prismicio/client'
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
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
  next_page: string;
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ results, next_page }: PostPagination) {
  const [pagination, setPagination] = useState<string>(next_page);
  const [posts, setPosts] = useState<Post[]>(results);

  async function handlePagination (){
    if(pagination){

     await fetch(pagination)
      .then(response => response.json())
      .then(data => ( setPosts(posts.concat(data.results.map((posts: Post) => {
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
      }))),  setPagination(data.next_page)))

    }

  }

  return (
    <>
      <Head>
        <title>Posts | Ignews</title>
      </Head>

      <main className={commonStyles.container} >
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`posts/${post.uid}`}>
              <a key={post.uid}>
                <div className={styles.postBody}>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle} </p>
                </div>
                <div className={styles.info}>
                  <FiCalendar /> <time> {post.first_publication_date}</time>
                  <FiUser /> <p> {post.data.author} </p>
                </div>
              </a>
            </Link>
          ))}
          { pagination && (

          <div className={styles.buttonLoad}>
          <a onClick={handlePagination}>Carregar mais posts</a>
          </div>
          )}
        </div>
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
    pageSize: 2,
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

  const next_page = postsResponse.next_page;

  return {
    props: {
      results,
      next_page,
    },
  }
};
