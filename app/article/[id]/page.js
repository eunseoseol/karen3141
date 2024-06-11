"use client"; // 클라이언트 컴포넌트로 지정
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './../../firebase';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { UserAuth } from "./../../context/AuthContext";

const Article = ({ params }) => {
  const { id } = params;
  const [article, setArticle] = useState(null);
  const [authorInfo, setAuthorInfo] = useState({ name: '', profileImage: '' });
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [recommendedArticles, setRecommendedArticles] = useState([]);
  const { user } = UserAuth();

  useEffect(() => {
    const fetchArticle = async () => {
      if (id) {
        const docRef = doc(db, 'KarenArticles', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const articleData = docSnap.data();
          setArticle(articleData);
          setComments(articleData.comments || []);

          // 작성자의 정보 가져오기
          const userDocRef = doc(db, 'users', articleData.author);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setAuthorInfo({
              name: userData.profile.name || 'Unknown',
              profileImage: userData.profileImage || ''
            });
          }
        } else {
          console.log('No such document!');
        }
      }
    };

    const fetchRecommendedArticles = async () => {
      const q = query(collection(db, 'KarenArticles'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const articlesData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const userDocRef = doc(db, 'users', data.author);
        const userDocSnapshot = await getDoc(userDocRef);
        const userData = userDocSnapshot.exists() ? userDocSnapshot.data() : { profile: { name: 'Unknown' } };
        return {
          id: docSnapshot.id,
          ...data,
          authorName: userData.profile.name,
        };
      }));
      setRecommendedArticles(articlesData);
    };

    fetchArticle();
    fetchRecommendedArticles();
  }, [id]);

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleCommentSubmit = async () => {
    if (comment.trim() && user) {
      const newComment = {
        email: user.email,
        name: user.displayName || 'Anonymous',
        profileImage: user.photoURL || null,
        timestamp: new Date().toISOString(),
        content: comment,
      };

      const docRef = doc(db, 'JarvisArticle', id);
      await updateDoc(docRef, {
        comments: arrayUnion(newComment)
      });

      setComments([...comments, newComment]);
      setComment('');
    }
  };

  const isValidDate = (date) => {
    return !isNaN(Date.parse(date));
  };

  const calculateReadTime = (text) => {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const extractPreviewText = (html) => {
    if (typeof document !== 'undefined') {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";
      return textContent.substring(0, 200) + (textContent.length > 200 ? "..." : ""); // 첫 200자 표시
    }
    return "";
  };

  const extractFirstImage = (html) => {
    if (typeof document !== 'undefined') {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const img = tempDiv.querySelector("img");
      return img ? img.src : null;
    }
    return null;
  };

  if (!article) {
    return <div>Loading...</div>;
  }

  const readTime = calculateReadTime(article.content);

  return (
    <main className="p-4">
      <div className="content-container">
        <div className="mb-4">
          <div className="flex items-center">
            {authorInfo.profileImage ? (
              <img
                src={authorInfo.profileImage}
                alt="Profile"
                className="w-12 h-12 rounded-full mr-4"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-500 text-white flex items-center justify-center mr-4">
                {authorInfo.name.slice(0, 2)}
              </div>
            )}
            <div>
              <p className="font-bold">{authorInfo.name}</p>
              <p className="text-sm text-gray-500">{readTime} min read &middot; {new Date(article.createdAt.toDate()).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-bold">{article.title}</h1>
        <div className="mt-4" dangerouslySetInnerHTML={{ __html: article.content }}></div>
        
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">댓글</h2>
          <div className="mb-4">
            {comments.map((comment, index) => (
              <div key={index} className="border-b border-gray-300 py-4">
                <div className="flex items-center mb-2">
                  {comment.profileImage ? (
                    <img
                      src={comment.profileImage}
                      alt="Profile"
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  ) : (
                    comment.name && (
                      <div className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center mr-2">
                        {comment.name.slice(0, 2)}
                      </div>
                    )
                  )}
                  <div>
                    {comment.name && <p className="font-bold">{comment.name}</p>}
                    {isValidDate(comment.timestamp) && (
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(comment.timestamp))} 전
                      </p>
                    )}
                  </div>
                </div>
                <p>{comment.content}</p>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <textarea
              className="w-full p-2 border rounded"
              rows="4"
              placeholder="댓글을 작성하세요..."
              value={comment}
              onChange={handleCommentChange}
            />
          </div>
          <button
            className="bg-blue-500 text-white p-2 rounded"
            onClick={handleCommentSubmit}
          >
            댓글 달기
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">추천 아티클</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedArticles.map(recommended => (
              <Link key={recommended.id} href={`/article/${recommended.id}`} legacyBehavior>
                <a className="block border p-4 cursor-pointer hover:bg-gray-100 transition-colors duration-300 rounded-lg">
                  {extractFirstImage(recommended.content) && (
                    <div className="mb-4">
                      <img src={extractFirstImage(recommended.content)} alt={recommended.title} className="w-full h-auto rounded-lg" />
                    </div>
                  )}
                  <h2 className="text-xl font-bold mb-2">{recommended.title}</h2>
                  <p className="text-sm text-gray-500 mb-2">
                    작성자: {recommended.authorName} • {formatDistanceToNow(new Date(recommended.createdAt.toDate()))} 전
                  </p>
                  <p className="mb-4">{extractPreviewText(recommended.content)}</p>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Article;
