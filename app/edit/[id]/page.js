"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./../../firebase";
import Spinner from "./../../components/Spinner";

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const EditArticle = () => {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const quillRef = React.useRef(null);

  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
      const docRef = doc(db, "JarvisArticle", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const article = docSnap.data();
        setTitle(article.title);
        setContent(article.content);
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    };

    fetchArticle();
  }, [id]);

  const handleUpdate = async () => {
    setLoading(true);
    const docRef = doc(db, "JarvisArticle", id);
    await updateDoc(docRef, {
      title: title,
      content: content,
      updatedAt: new Date()
    });
    setLoading(false);
    router.push('/');
  };

  if (loading) return <Spinner />;

  return (
    <div className="content-container">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Edit Article</h1>
          <button
            type="button"
            className="bg-blue-500 text-white p-2 rounded"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            className="border rounded w-full p-2"
            placeholder="Enter the title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Content</label>
          <div style={{ height: '800px' }}>
            <ReactQuill
              ref={quillRef}
              value={content}
              onChange={setContent}
              className="border rounded"
              style={{ height: '100%', maxHeight: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditArticle;
