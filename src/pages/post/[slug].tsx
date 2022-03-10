import Header from '../../components/Header'
import Prismic from '@prismicio/client'

import { FiCalendar, FiUser, FiClock } from "react-icons/fi"

import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';

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
}

export default function Post(props: PostProps) {
  const { post } = props
  const router = useRouter()
  
  if(router.isFallback){
    return <p>Carregando...</p>
  }

  const postContent = post.data.content

  const readingTime = postContent.map(
    content => {
      const postBody = content.body.map(
        body => {
          return body.text
        }
      )

      return (
        `${content.heading} ${postBody}`
      )
    }
  ).join().match(/\S+/g).length

  return (
    <>
      <Header/>
        {
          post &&
          
          <div className={styles.postContainer}>
            <img src={post.data.banner.url} alt="image" /> 
            <div className={styles.articleContainer}>              
              <h1>{post.data.title}</h1>
              <div className={styles.miscellaneousInformation}>
                <time> <FiCalendar/>{format(new Date(post.first_publication_date),"dd MMM yyyy",{ locale: ptBR})}</time>
                <span><FiUser/>{post.data.author}</span>
                <span><FiClock/>{Math.ceil(readingTime / 200)} min</span>
              </div>  
                {
                  post.data.content.map(
                    (content, index) => {
                      return (
                        <div key={index}>
                          <h2>{content.heading}</h2>
                          {content.body.map(
                            (body, index) => {
                              return <p key={`Par: ${index}`}>{body.text}</p>
                            }
                          )}
                        </div>
                      )
                    }
                  )
                }
            </div>       
          </div>        
        }
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at(
      'document.type', 'posts'
    ),
  );

  const paths = posts.results.map(post => ({
    params: {slug: post.uid} 
  }))

  return {
    paths: paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async context => {

  const  slug  = context.params.slug as string

  const prismic = getPrismicClient();
  const response = await prismic.getByUID(
    'posts', slug, {}
  );

  const content = response.data.content.map(
    (content: any) => {
      return {
          heading: content.heading,
          body: content.body
      }
    }
  )

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    // first_publication_date: format(new Date(response.first_publication_date),"dd MMM yyyy",{ locale: ptBR}),
      data: {
        title: response.data.title,
        subtitle: response.data.subtitle,
        banner: {
          url: response.data.banner.url
        },
        author: response.data.author,
        content: content,
      }
    }
  
  return{
    props:{
     post: post 
    }
  }
};
