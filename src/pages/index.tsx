import { format } from "date-fns";
import ptBR from 'date-fns/locale/pt-BR'

import { FiCalendar, FiUser } from "react-icons/fi"
import  Link from 'next/link'

import { GetStaticProps } from 'next';
import  Head  from 'next/head';

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';
import { useState } from "react";

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
}

export default function Home( props: HomeProps ) {
  const { results, next_page } = props.postsPagination
  
  const [posts, setPosts] = useState(results)
  const [nextPage, setNextPage] = useState(next_page)
  
  async function getPostNextPage() {

    if(nextPage === null){
      return
    }

    const NextPageRes = await fetch(nextPage)
    const NextPageData = await NextPageRes.json()

    const newResults = NextPageData.results.map(
      (posts: Post) => {
        return {
          uid: posts.uid,
          first_publication_date: posts.first_publication_date,  
          data: {
            title: posts.data.title,
            subtitle: posts.data.subtitle,
            author: posts.data.author 
          }
        }
      }
    )
    
    setNextPage(NextPageData.next_page)

    setPosts(oldPosts => [...oldPosts, ...newResults])

  }

  return (
    <>
      <Head>
        <title>Home | AprendizadoReact</title>
      </Head> 

      <main className={styles.container}>
        <img src="images/logo.svg" alt="logo" />
            {
              posts.map((post: Post) => {
                return (
                  <Link key={post.uid} href={`post/${post.uid}`}>
                    <a className={styles.post}>
                      <h2>{post.data.title}</h2>
                      <p>{post.data.subtitle}</p>
                      <time> <FiCalendar/> {format(new Date(post.first_publication_date),"dd MMM yyyy",{ locale: ptBR})} </time>
                      <span> <FiUser/>{post.data.author}</span>
                    </a>
                  </Link>    
                )
              })
            }
            {
              nextPage !== null 
              ? <button 
                  className={styles.morePosts}
                  onClick={getPostNextPage}
                >
                  Carregar mais posts
                </button>
              : <></>
            }
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query( 
    Prismic.predicates.at(
      'document.type',
      'posts',
    ), 
    {
      pageSize: 3
    }
);
  const results = postsResponse.results.map(posts => {
      return {
        uid: posts.uid,
        // first_publication_date: format(new Date(posts.first_publication_date),"dd MMM yyyy",{ locale: ptBR}),  
        first_publication_date: posts.first_publication_date,
        data: {
          title: posts.data.title,
          subtitle: posts.data.subtitle,
          author: posts.data.author 
        }
      }
    }
  )

  let next_page = postsResponse.next_page

  return {
    props: {
      postsPagination: {
        results, 
        next_page 
      }
    }
  }

};
