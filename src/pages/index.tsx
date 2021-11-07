import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  function getMorePosts() {
    fetch(postsPagination.next_page).then(data =>  data.json()).then(data => {
      setNextPage(data.next_page);
      let newPosts: Post[] = [...posts];
      setPosts(newPosts.concat(data.results));
    })
  }

  return(
    <>
    <Head>
      <title>Posts | Ignews</title>
    </Head>

    <main className={commonStyles.container} >
      <div className={styles.posts}>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`}>
            <a key={post.uid}>
              <div className={styles.postBody}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle} </p>
              </div>
              <div className={commonStyles.info}>
                <FiCalendar /> <time> {post.first_publication_date}</time>
                <FiUser /> <p> {post.data.author} </p>
              </div>
            </a>
          </Link>
        ))}
        { nextPage && (

        <div className={styles.buttonLoad}>
        <a onClick={getMorePosts}>Carregar mais posts</a>
        </div>
        )}
      </div>
    </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['post.title', 'post.subtitle', 'post.author'],
    pageSize: 20,
    ref: previewData?.ref ?? null,
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

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: results,
  };
 
  return {
    props: {
      postsPagination,
      preview
    }
  }
};